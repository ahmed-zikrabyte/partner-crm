import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

export type TAdminRole = "super-admin";

export interface IAdmin {
  name: string;
  email: string;
  password: string;
  role: TAdminRole;
  userKey?: string;
  isActive: boolean;
  comparePassword: (password: string) => Promise<boolean>;
}

const adminSchema = new mongoose.Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["super-admin"],
      default: "super-admin",
    },
    userKey: { type: String, required: false, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

adminSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

export const ADMIN_DB_REF = "admin";
export const AdminModel = mongoose.model(ADMIN_DB_REF, adminSchema);
