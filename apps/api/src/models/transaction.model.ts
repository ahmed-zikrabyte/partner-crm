import mongoose from "mongoose";

export interface ITransaction {
  partnerId: mongoose.Types.ObjectId;
  author: {
    authorType: "partner" | "employee";
    authorId: mongoose.Types.ObjectId;
  };
  vendorId?: mongoose.Types.ObjectId;
  deviceId?: mongoose.Types.ObjectId;
  amount: number;
  note: string;
  paymentMode?: "upi" | "card" | "cash";
  type: "return" | "sell" | "credit" | "debit" | "investment";
  date: Date;
}

const transactionSchema = new mongoose.Schema<ITransaction>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
    },
    author: {
      authorType: {
        type: String,
        enum: ["partner", "employee"],
        required: true,
      },
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "author.authorType",
      },
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vendor",
      required: function () {
        return this.type === "sell" || this.type === "return" || this.type === "investment";
      },
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "device",
      required: function () {
        return this.type === "return";
      },
    },
    amount: { type: Number, required: true },
    note: { type: String, trim: true },
    paymentMode: {
      type: String,
      enum: ["upi", "card", "cash"],
      required: function () {
        return this.type === "sell" || this.type === "return" || this.type === "investment";
      },
    },
    type: {
      type: String,
      enum: ["return", "sell", "credit", "debit", "investment"],
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TRANSACTION_DB_REF = "transaction";
export const TransactionModel = mongoose.model<ITransaction>(
  TRANSACTION_DB_REF,
  transactionSchema
);
