import * as z from "zod";

// ✅ Schema for creating a device
export const createDeviceSchema = z.object({
  companyIds: z.string().min(1, "Company is required"),
  selectedCompanyIds: z.string().min(1, "Company ID is required"),
  date: z.string().min(1, "Date is required"),
  serviceNumber: z.string().min(1, "Service Number is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  imei1: z.string().min(1, "IMEI1 is required"),
  imei2: z.string().optional(),
  initialCost: z.number().nonnegative("Initial Cost must be positive").min(0.01, "Initial Cost is required"),
  cost: z.number().nonnegative("Cost must be positive").min(0.01, "Cost is required"),
  extraAmount: z.number().nonnegative("Extra Amount must be positive").optional().default(0),
  credit: z.number().nonnegative("Credit must be positive").min(0.01, "Credit is required"),
  perCredit: z.number().nonnegative("Per Credit must be positive").min(0.01, "Per Credit is required"),
  commission: z.number().nonnegative("Commission must be positive").optional().default(0),
  gst: z.number().nonnegative("GST must be positive").optional().default(0),
  totalCost: z.number().nonnegative("Total Cost must be positive").optional().default(0),
  selling: z.number().nonnegative("Selling price must be positive").optional(),
  soldTo: z.string().optional(),
  profit: z.number().optional(),
  pickedBy: z.string().min(1, "Picked By is required"),
  box: z.string().min(1, "Box is required"),
  warranty: z.string().min(1, "Warranty is required"),
  issues: z.string().min(1, "Issues is required"),
  isActive: z.boolean().default(true).optional(),
});

// ✅ Schema for updating a device
export const updateDeviceSchema = createDeviceSchema.partial();

export type DeviceFormData = z.infer<typeof createDeviceSchema>;

export interface DeviceData extends Omit<DeviceFormData, 'selectedCompanyIds'> {
  _id: string;
  partnerId: string;
  deviceId: string;
  selectedCompanyIds?: string;
  sellHistory?: {
    type: "sell" | "return";
    vendor: { _id: string; name: string };
    amount?: number;
    selling?: number;
    returnAmount?: number;
    createdAt: string;
  }[];

  qrCodeUrl?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
