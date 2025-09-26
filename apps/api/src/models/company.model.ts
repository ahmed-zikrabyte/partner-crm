import mongoose from "mongoose";

export interface ICompany {
  partnerId: mongoose.Types.ObjectId;
  name: string;
  creditValue: number;
  companyIds: string[];
  isActive?: boolean;
  isDeleted?: boolean;
}

const companySchema = new mongoose.Schema<ICompany>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    creditValue: { type: Number, default: 0 },
    companyIds: [{ type: String, required: true, trim: true }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const COMPANY_DB_REF = "company";
export const CompanyModel = mongoose.model<ICompany>(
  COMPANY_DB_REF,
  companySchema
);
