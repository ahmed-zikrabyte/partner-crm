import mongoose from "mongoose";

export interface IVendor {
  partnerId: mongoose.Types.ObjectId;
  name: string;
  amount: number; // balance or initial credit
  isActive?: boolean;
  isDeleted?: boolean;
}

const vendorSchema = new mongoose.Schema<IVendor>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const VENDOR_DB_REF = "vendor";
export const VendorModel = mongoose.model<IVendor>(VENDOR_DB_REF, vendorSchema);
