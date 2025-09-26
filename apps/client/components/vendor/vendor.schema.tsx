import * as z from "zod";

// ✅ Schema for creating a vendor
export const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .nonnegative("Amount cannot be negative")
    .default(0)
    .optional(),
  isActive: z.boolean().default(true).optional(),
});

// ✅ Schema for updating a vendor
export const updateVendorSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .nonnegative("Amount cannot be negative")
    .optional(),
  isActive: z.boolean().optional(),
});

export const vendorFormSchema = createVendorSchema;

export type VendorFormData = z.infer<typeof vendorFormSchema>;

export interface VendorData {
  _id: string;
  partnerId: string;
  name: string;
  amount: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
