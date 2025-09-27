import * as z from "zod";

// ✅ Schema for creating a company
export const createCompanySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  creditValue: z
    .number({ invalid_type_error: "Credit value must be a number" })
    .nonnegative("Credit value cannot be negative"),
  companyIds: z.array(z.string()).min(1, "At least one company ID is required"),
  isActive: z.boolean().default(true).optional(),
});

// ✅ Schema for updating a company
export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  creditValue: z
    .number({ invalid_type_error: "Credit value must be a number" })
    .nonnegative("Credit value cannot be negative")
    .optional(),
  companyIds: z.array(z.string()).min(1, "At least one company ID is required").optional(),
  isActive: z.boolean().optional(),
});

export const companyFormSchema = createCompanySchema;

export type CompanyFormData = z.infer<typeof companyFormSchema>;

export interface CompanyData {
  _id: string;
  partnerId: string;
  name: string;
  creditValue: number;
  companyIds?: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
