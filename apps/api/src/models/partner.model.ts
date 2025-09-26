import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

export type TPartnerRole = "partner";

export interface IPartner {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: TPartnerRole;
  cashAmount?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  comparePassword: (password: string) => Promise<boolean>;
}

const partnerSchema = new mongoose.Schema<IPartner>(
  {
    name: { type: String, required: false, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["partner"],
      default: "partner",
    },
    cashAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

partnerSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

export const PARTNER_DB_REF = "partner";
export const PartnerModel = mongoose.model(PARTNER_DB_REF, partnerSchema);
