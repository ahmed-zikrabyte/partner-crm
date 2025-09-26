import * as z from "zod";

const phoneRegex = /^[0-9]{10,15}$/;

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(phoneRegex, "Phone must be 10-15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isActive: z.boolean().default(true).optional(),
});


export const updatePartnerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(phoneRegex, "Phone must be 10-15 digits").optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

export const partnerFormSchema = createPartnerSchema;

export type PartnerFormData = z.infer<typeof partnerFormSchema>;

export interface PartnerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "partner";
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
