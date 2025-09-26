import mongoose from "mongoose";

export interface ITransaction {
  partnerId: mongoose.Types.ObjectId;
  author: {
    authorType: "partner" | "employee";
    authorId: mongoose.Types.ObjectId;
  };
  vendorId: mongoose.Types.ObjectId;
  amount: number;
  note: string;
  paymentMode: "upi" | "card" | "cash";
  type: "return" | "sell";
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
      required: true,
    },
    amount: { type: Number, required: true },
    note: { type: String, trim: true },
    paymentMode: {
      type: String,
      enum: ["upi", "card", "cash"],
      required: true,
    },
    type: {
      type: String,
      enum: ["return", "sell"],
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
