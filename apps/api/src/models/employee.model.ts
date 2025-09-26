import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

export type TEmployeeRole = "employee";

export interface IEmployee {
    partnerId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    password: string;
    salaryPerDay: number;
    role: TEmployeeRole;
    isActive?: boolean;
    isDeleted?: boolean;
    comparePassword: (password: string) => Promise<boolean>;
}

const employeeSchema = new mongoose.Schema<IEmployee>(
    {
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "partner",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        password: { type: String, required: true },
        salaryPerDay: { type: Number, required: true, default: 0 },
        role: {
            type: String,
            enum: ["employee"],
            default: "employee",
        },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

employeeSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcryptjs.compare(password, this.password);
};

export const EMPLOYEE_DB_REF = "employee";
export const EmployeeModel = mongoose.model<IEmployee>(
    EMPLOYEE_DB_REF,
    employeeSchema
);
