// backend/src/models/wallet.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  address: string;
  vaultKeyPath: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      type: String,
      required: true,
      unique: true,
    },
    vaultKeyPath: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "My Wallet",
    },
  },
  { timestamps: true }
);

// Create compound index on userId and address
walletSchema.index({ userId: 1, address: 1 }, { unique: true });

export default mongoose.model<IWallet>("Wallet", walletSchema);
