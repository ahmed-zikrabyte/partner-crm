import * as z from "zod";

// ✅ Schema for creating an employee
export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  salaryPerDay: z.number().nonnegative("Salary per day cannot be negative"),
});

// ✅ Schema for updating an employee
export const updateEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  salaryPerDay: z.number().nonnegative("Salary per day cannot be negative").optional(),
});

// ✅ Schema for employee login
export const employeeLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type EmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type EmployeeUpdateData = z.infer<typeof updateEmployeeSchema>;
export type EmployeeLoginData = z.infer<typeof employeeLoginSchema>;

export interface EmployeeData {
  _id: string;
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  salaryPerDay: number;
  role: "employee";
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}