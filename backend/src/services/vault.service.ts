// backend/src/services/vault.service.ts
import crypto from "crypto";
import cacheService from "./cache.service";
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

// Initialize AWS KMS client if AWS credentials are available
let kmsClient: KMSClient | null = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  kmsClient = new KMSClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  console.log("KMS client initialized");
} else {
  console.log("KMS client not initialized - using local encryption");
}

// In-memory store for encrypted keys when not using KMS
const memoryVault = new Map<string, { privateKey: string; iv: string }>();

// Encryption function using AES-256-GCM for local encryption
const encryptLocal = (text: string): { encrypted: string; iv: string } => {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  // Use a secure encryption key
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_SECRET || "default-encryption-key",
    "salt",
    32
  );
  // Create cipher
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  // Encrypt the text
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Get the auth tag
  const authTag = cipher.getAuthTag();
  // Return encrypted data with IV
  return {
    encrypted: encrypted + ":" + authTag.toString("hex"),
    iv: iv.toString("hex"),
  };
};

// Decryption function using AES-256-GCM for local decryption
const decryptLocal = (encrypted: string, iv: string): string => {
  // Split encrypted text and auth tag
  const [encryptedText, authTag] = encrypted.split(":");
  // Convert IV from hex to Buffer
  const ivBuffer = Buffer.from(iv, "hex");
  // Use the same key as for encryption
  const key = crypto.scryptSync(
    process.env.ENCRYPTION_SECRET || "default-encryption-key",
    "salt",
    32
  );
  // Create decipher
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuffer);
  // Set auth tag
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  // Decrypt
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

class VaultService {
  // Store a private key (with KMS if available, otherwise locally)
  async storePrivateKey(userId: string, privateKey: string): Promise<string> {
    try {
      // Generate a unique path for this key
      const keyPath = `wallet/${userId}/${uuidv4()}`;

      // Try to use KMS if available
      if (kmsClient && process.env.KMS_KEY_ID) {
        // Encrypt the data using KMS
        const encryptParams = {
          KeyId: process.env.KMS_KEY_ID,
          Plaintext: Buffer.from(privateKey),
        };

        try {
          const encryptResult = await kmsClient.send(
            new EncryptCommand(encryptParams)
          );

          if (!encryptResult.CiphertextBlob) {
            throw new Error("KMS encryption failed");
          }

          // Store in memory vault with KMS flag
          memoryVault.set(keyPath, {
            privateKey: Buffer.from(encryptResult.CiphertextBlob).toString(
              "base64"
            ),
            iv: "KMS", // Special marker to indicate KMS encryption
          });

          console.log(`Private key stored at path: ${keyPath} (using KMS)`);
        } catch (kmsError) {
          console.error(
            "KMS encryption failed, falling back to local encryption:",
            kmsError
          );
          // Fall back to local encryption if KMS fails
          const { encrypted, iv } = encryptLocal(privateKey);
          memoryVault.set(keyPath, {
            privateKey: encrypted,
            iv: iv,
          });
          console.log(
            `Private key stored at path: ${keyPath} (using local encryption after KMS fail)`
          );
        }
      } else {
        // Fallback to local encryption
        const { encrypted, iv } = encryptLocal(privateKey);

        // Store in memory vault
        memoryVault.set(keyPath, {
          privateKey: encrypted,
          iv: iv,
        });

        console.log(
          `Private key stored at path: ${keyPath} (using local encryption)`
        );
      }

      return keyPath;
    } catch (error) {
      console.error("Error storing private key:", error);
      throw new Error("Failed to securely store private key");
    }
  }

  // Retrieve a private key
  async getPrivateKey(keyPath: string): Promise<string> {
    try {
      // Try to get from cache first
      const cachedKey = cacheService.get<{ encrypted: string; iv: string }>(
        `key:${keyPath}`
      );

      if (cachedKey) {
        if (cachedKey.iv === "KMS") {
          // Decrypt using KMS
          if (!kmsClient) throw new Error("KMS client not initialized");

          const decryptParams = {
            CiphertextBlob: Buffer.from(cachedKey.encrypted, "base64"),
          };

          const decryptResult = await kmsClient.send(
            new DecryptCommand(decryptParams)
          );

          if (!decryptResult.Plaintext) {
            throw new Error("KMS decryption returned no plaintext");
          }

          return Buffer.from(decryptResult.Plaintext).toString();
        } else {
          // Decrypt using local mechanism
          return decryptLocal(cachedKey.encrypted, cachedKey.iv);
        }
      }

      // If not in cache, get from memory vault
      const keyData = memoryVault.get(keyPath);
      if (!keyData) {
        throw new Error(`Private key not found at path: ${keyPath}`);
      }

      const { privateKey, iv } = keyData;

      // Decode based on encryption method
      let decryptedKey: string;
      if (iv === "KMS") {
        // Decrypt using KMS
        if (!kmsClient || !process.env.KMS_KEY_ID) {
          throw new Error("KMS not configured but key was KMS-encrypted");
        }

        const decryptParams = {
          CiphertextBlob: Buffer.from(privateKey, "base64"),
        };

        const decryptResult = await kmsClient.send(
          new DecryptCommand(decryptParams)
        );

        if (!decryptResult.Plaintext) {
          throw new Error("KMS decryption returned no plaintext");
        }

        decryptedKey = Buffer.from(decryptResult.Plaintext).toString();
      } else {
        // Decrypt using local mechanism
        decryptedKey = decryptLocal(privateKey, iv);
      }

      // Cache for a short time (1 minute)
      cacheService.set(`key:${keyPath}`, { encrypted: privateKey, iv }, 60);

      return decryptedKey;
    } catch (error) {
      console.error("Error retrieving private key:", error);
      throw new Error("Failed to retrieve private key");
    }
  }

  // Rotate encryption keys (for enhanced security)
  async rotateKey(keyPath: string): Promise<string> {
    try {
      // Get the current private key
      const privateKey = await this.getPrivateKey(keyPath);

      // Extract user ID from path
      const pathParts = keyPath.split("/");
      if (pathParts.length < 2) {
        throw new Error("Invalid key path format");
      }
      const userId = pathParts[1];

      // Store with new encryption
      const newKeyPath = await this.storePrivateKey(userId, privateKey);

      // Remove old key reference
      memoryVault.delete(keyPath);
      cacheService.delete(`key:${keyPath}`);

      return newKeyPath;
    } catch (error) {
      console.error("Error rotating encryption key:", error);
      throw new Error("Failed to rotate encryption key");
    }
  }
}

export default new VaultService();
