import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  ServerIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const AboutPage: React.FC = () => {
  return (
    <div className="py-12 bg-slate-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 mb-8"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Enterprise-Grade Security for Your Assets
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300">
            Learn how CryptoVault protects your digital assets with advanced
            security measures and cutting-edge technology.
          </p>
        </div>

        {/* Main Content */}
        <div className="mt-16">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-16 sm:px-8 sm:py-24 lg:py-32 text-white">
              <div className="relative max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-4">
                    Your Security Is Our Priority
                  </h2>
                  <p className="text-lg">
                    CryptoVault employs a multi-layered approach to security,
                    using industry-leading encryption, secure key management,
                    and advanced authentication mechanisms to ensure your assets
                    are always protected.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-6 w-6 mr-2" />
                      <span>AWS KMS Integration</span>
                    </div>
                    <div className="flex items-center">
                      <LockClosedIcon className="h-6 w-6 mr-2" />
                      <span>AES-256-GCM Encryption</span>
                    </div>
                    <div className="flex items-center">
                      <KeyIcon className="h-6 w-6 mr-2" />
                      <span>Secure Key Management</span>
                    </div>
                    <div className="flex items-center">
                      <ServerIcon className="h-6 w-6 mr-2" />
                      <span>Layered Architecture</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details Section */}
            <div className="px-6 py-12 sm:px-8 lg:px-12 max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                Technical Architecture
              </h2>

              {/* Architecture Diagram */}
              <div className="bg-slate-50 dark:bg-dark-700 p-8 rounded-xl mb-12">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  System Architecture Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
                    <div className="flex justify-center mb-2">
                      <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                        <CubeTransparentIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      API Endpoints
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      RESTful interface for application interactions
                    </p>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
                    <div className="flex justify-center mb-2">
                      <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                        <CpuChipIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Service Layer
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Core business logic and orchestration
                    </p>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
                    <div className="flex justify-center mb-2">
                      <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                        <ServerIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Data Models
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Structured data representations
                    </p>
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <svg height="40" width="100">
                    <line
                      x1="50"
                      y1="0"
                      x2="50"
                      y2="40"
                      style={{ stroke: "rgb(203, 213, 225)", strokeWidth: 2 }}
                    />
                    <polygon
                      points="45,30 55,30 50,40"
                      style={{ fill: "rgb(203, 213, 225)" }}
                    />
                  </svg>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
                    <div className="flex justify-center mb-2">
                      <div className="bg-secondary-100 dark:bg-secondary-900/30 p-2 rounded-full">
                        <UserGroupIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Middleware
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Authentication and request processing
                    </p>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
                    <div className="flex justify-center mb-2">
                      <div className="bg-secondary-100 dark:bg-secondary-900/30 p-2 rounded-full">
                        <KeyIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Key Management
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Secure private key handling
                    </p>
                  </div>
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow">
                    <div className="flex justify-center mb-2">
                      <div className="bg-secondary-100 dark:bg-secondary-900/30 p-2 rounded-full">
                        <ChartBarIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      MongoDB/Cache
                    </h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Persistent and temporary storage
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-12">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Private Key Protection
                  </h3>
                  <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
                    <div className="px-6 py-5">
                      <p className="text-slate-700 dark:text-slate-300 mb-6">
                        Our system employs a hybrid approach for private key
                        protection, using multiple layers of encryption to
                        ensure maximum security:
                      </p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-primary-700 dark:text-primary-400 mb-2">
                            AWS KMS Encryption
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            When AWS credentials are available, private keys are
                            encrypted using AWS KMS, a FIPS 140-2 compliant
                            service.
                          </p>
                          <div className="bg-slate-100 dark:bg-dark-800 p-3 rounded-md overflow-auto text-xs">
                            <pre className="font-mono text-slate-800 dark:text-slate-300">
                              {`const encryptResult = await kmsClient.send(
  new EncryptCommand({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(privateKey)
  })
);`}
                            </pre>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-primary-700 dark:text-primary-400 mb-2">
                            Local AES-256-GCM Encryption
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            As a fallback, the system uses AES-256-GCM
                            encryption with a secure key derivation function.
                          </p>
                          <div className="bg-slate-100 dark:bg-dark-800 p-3 rounded-md overflow-auto text-xs">
                            <pre className="font-mono text-slate-800 dark:text-slate-300">
                              {`const key = crypto.scryptSync(
  process.env.ENCRYPTION_SECRET, 
  "salt", 
  32
);
const cipher = crypto.createCipheriv(
  "aes-256-gcm", 
  key, 
  iv
);`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Memory Management
                  </h3>
                  <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
                    <div className="px-6 py-5">
                      <p className="text-slate-700 dark:text-slate-300 mb-4">
                        Our system implements strict memory management policies
                        to ensure sensitive data is not exposed:
                      </p>

                      <ul className="space-y-2 text-slate-700 dark:text-slate-300 list-disc pl-5">
                        <li>Private keys are never stored in plain text</li>
                        <li>
                          Keys are cached for minimal time periods (60 seconds)
                        </li>
                        <li>
                          References to sensitive data are cleared from memory
                          when no longer needed
                        </li>
                        <li>
                          Encrypted keys are referenced via unique paths in the
                          format wallet/{"{userId}"}/{"{uuid}"}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Authentication Security
                  </h3>
                  <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
                    <div className="px-6 py-5">
                      <p className="text-slate-700 dark:text-slate-300 mb-6">
                        Our authentication system employs multiple security
                        features to protect user accounts:
                      </p>

                      <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                          Enhanced JWT Implementation
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          Our system uses JWT tokens with enhanced security
                          features.
                        </p>
                        <div className="bg-slate-100 dark:bg-dark-800 p-3 rounded-md overflow-auto text-xs">
                          <pre className="font-mono text-slate-800 dark:text-slate-300">
                            {`const accessToken = jwt.sign(
  { 
    userId,
    jti: accessJti,  // Random unique identifier
    version: TOKEN_VERSION  // For future validation
  },
  process.env.JWT_SECRET,
  { 
    expiresIn: "1h",
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER
  }
);`}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Short-lived Tokens
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            JWT tokens with short expiry (1 hour) limit the
                            window of vulnerability if tokens are compromised.
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Refresh Token Rotation
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Refresh tokens are rotated on use, preventing token
                            reuse attacks and improving security.
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            JTI Tracking
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            JWT ID tracking prevents replay attacks by ensuring
                            each token can only be used once.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Transaction Security
                  </h3>
                  <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
                    <div className="px-6 py-5">
                      <p className="text-slate-700 dark:text-slate-300 mb-6">
                        Transactions are handled with strict security protocols:
                      </p>

                      <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                          Secure Transaction Signing
                        </h4>
                        <div className="bg-slate-100 dark:bg-dark-800 p-3 rounded-md overflow-auto text-xs">
                          <pre className="font-mono text-slate-800 dark:text-slate-300">
                            {`// Get private key securely
const privateKey = await vaultService.getPrivateKey(wallet.vaultKeyPath);

// Create wallet instance
const walletInstance = new ethers.Wallet(privateKey, provider);

// Build transaction
const txRequest = {
  to: toAddress,
  value: ethers.parseEther(amount),
  gasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas
};

// Sign and send transaction
const tx = await walletInstance.sendTransaction(txRequest);`}
                          </pre>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            Dynamic Gas Estimation
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Our system provides dynamic gas estimation with
                            three speed options (Slow, Standard, Fast) to
                            optimize transaction costs and confirmation times.
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                            EIP-1559 Support
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Full support for EIP-1559 transactions with dynamic
                            base fee, priority fee, and max fee calculations
                            based on network conditions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Have Questions About Security?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Our team is committed to providing the highest level of security for
            your assets. Contact us if you have any questions or concerns.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
