import { EmployeeModel, IEmployee } from "../../../../models/employee.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";
import bcryptjs from "bcryptjs";

export default class EmployeeService {
  private employeeModel = EmployeeModel;

  async create({
    partnerId,
    name,
    email,
    phone,
    password,
    salaryPerDay,
  }: Partial<IEmployee> & {
    partnerId: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    salaryPerDay: number;
  }): Promise<ServiceResponse> {
    try {
      // Validate required fields
      const emptyFields = getEmptyFields({
        partnerId,
        name,
        email,
        phone,
        password,
        salaryPerDay,
      });
      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields}`,
          HTTP.BAD_REQUEST
        );
      }

      // Check if employee already exists
      const existingEmployee = await this.employeeModel.findOne({
        email,
        isDeleted: false,
      });
      if (existingEmployee) {
        throw new AppError("Employee with this email already exists", HTTP.CONFLICT);
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 12);

      // Create the employee
      const newEmployee = await this.employeeModel.create({
        partnerId,
        name,
        email,
        phone,
        password: hashedPassword,
        salaryPerDay,
        role: "employee",
        isActive: true,
      });

      await newEmployee.save();

      // Remove password from response
      const { password: _, ...employeeResponse } = newEmployee.toObject();

      return {
        message: "Employee created successfully",
        data: employeeResponse,
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async update(
    id: string,
    updateData: Partial<IEmployee>
  ): Promise<ServiceResponse> {
    try {
      const employee = await this.employeeModel.findById(id);
      if (!employee) throw new AppError("Employee not found", HTTP.NOT_FOUND);

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcryptjs.hash(updateData.password, 12);
      }

      // Update the employee
      const updatedEmployee = await this.employeeModel.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      // Remove password from response
      const employeeObj = updatedEmployee?.toObject();
      const employeeResponse = employeeObj ? (() => {
        const { password: _, ...rest } = employeeObj;
        return rest;
      })() : null;

      return {
        message: "Employee updated successfully",
        data: employeeResponse,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(
    page: number = 1,
    limit: number = 10,
    partnerId?: string,
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };
      if (partnerId) query.partnerId = partnerId;
      if (typeof isActive === "boolean") query.isActive = isActive;
      if (search)
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];

      const skip = (page - 1) * limit;
      const fetchQuery = this.employeeModel.find(query).sort({ createdAt: -1 }).select("-password");
      if (limit !== 0) fetchQuery.skip(skip).limit(limit);

      const [employees, total] = await Promise.all([
        fetchQuery,
        this.employeeModel.countDocuments(query),
      ]);

      const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);

      return {
        data: {
          employees,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit === 0 ? total : limit,
            hasNext: limit === 0 ? false : page < totalPages,
            hasPrev: limit === 0 ? false : page > 1,
          },
        },
        message: "Employees fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(id: string): Promise<ServiceResponse> {
    try {
      const employee = await this.employeeModel.findById(id).select("-password");
      if (!employee) throw new AppError("Employee not found", HTTP.NOT_FOUND);

      return {
        data: employee,
        message: "Employee fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async softDelete(id: string): Promise<ServiceResponse> {
    try {
      const employee = await this.employeeModel.findById(id);
      if (!employee) throw new AppError("Employee not found", HTTP.NOT_FOUND);

      employee.isDeleted = true;
      await employee.save();

      return {
        message: "Employee deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleIsActive(id: string): Promise<ServiceResponse> {
    try {
      const employee = await this.employeeModel.findById(id);
      if (!employee) throw new AppError("Employee not found", HTTP.NOT_FOUND);

      employee.isActive = !employee.isActive;
      await employee.save();

      // Remove password from response
      const { password: _, ...employeeResponse } = employee.toObject();

      return {
        data: employeeResponse,
        message: `Employee is now ${employee.isActive ? "active" : "inactive"}`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}