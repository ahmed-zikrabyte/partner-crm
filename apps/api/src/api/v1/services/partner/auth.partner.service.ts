import bcrypt from "bcryptjs";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { PartnerModel } from "../../../../models/partner.model";
import { EmployeeModel } from "../../../../models/employee.model";
import type { ServiceResponse } from "../../../../typings";
import { generatePartnerToken } from "../../../../utils/text.utils";

interface PartnerLoginParams {
  email: string;
  password: string;
}

interface EmployeeLoginParams {
  email: string;
  password: string;
}

export class PartnerAuthService {
  private readonly partnerModel = PartnerModel;

  /** Partner LOGIN */
  async login({
    email,
    password,
  }: PartnerLoginParams): Promise<ServiceResponse> {
    try {
      const partner = await this.partnerModel.findOne({ email });
      if (!partner) throw new AppError("Partner not found", HTTP.NOT_FOUND);

      const isPasswordMatched = await partner.comparePassword(password);
      if (!isPasswordMatched)
        throw new AppError("Invalid credentials", HTTP.UNAUTHORIZED);

      const payload = { id: partner._id.toString(), role: partner.role };
      const token = generatePartnerToken(payload);

      return {
        data: {
          token,
          partner: {
            name: partner.name,
            email: partner.email,
            phone: partner.phone,
            role: partner.role,
            isActive: partner.isActive,
          },
        },
        message: "Login successful",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  /** Employee LOGIN */
  async employeeLogin({
    email,
    password,
  }: EmployeeLoginParams): Promise<ServiceResponse> {
    try {
      const employee = await EmployeeModel.findOne({ email, isDeleted: false });
      if (!employee) throw new AppError("Employee not found", HTTP.NOT_FOUND);

      if (!employee.isActive) {
        throw new AppError("Employee account is inactive", HTTP.UNAUTHORIZED);
      }

      const isPasswordMatched = await employee.comparePassword(password);
      if (!isPasswordMatched)
        throw new AppError("Invalid credentials", HTTP.UNAUTHORIZED);

      const payload = { id: employee._id.toString(), role: employee.role };
      const token = generatePartnerToken(payload);

      return {
        data: {
          token,
          employee: {
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            role: employee.role,
            salaryPerDay: employee.salaryPerDay,
            isActive: employee.isActive,
          },
        },
        message: "Employee login successful",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
