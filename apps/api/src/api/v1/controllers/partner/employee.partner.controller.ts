import { Request, Response } from "express";
import EmployeeService from "../../services/partner/employee.partner.service";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";

export default class EmployeeController {
  private employeeService = new EmployeeService();

  // Create employee
  create = async (req: Request, res: Response) => {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        throw new AppError("Partner ID is required", HTTP.UNAUTHORIZED);
      }

      const result = await this.employeeService.create({
        ...req.body,
        partnerId,
      });

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in create employee:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode,
        });
      } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Internal server error",
          status: HTTP.INTERNAL_SERVER_ERROR,
        });
      }
    }
  };

  // Get all employees
  getAll = async (req: Request, res: Response) => {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        throw new AppError("Partner ID is required", HTTP.UNAUTHORIZED);
      }
      
      const { page = 1, limit = 10, isActive, search } = req.query;

      const result = await this.employeeService.getAll(
        Number(page),
        Number(limit),
        partnerId,
        isActive === "true" ? true : isActive === "false" ? false : undefined,
        search as string
      );

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in get all employees:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode,
        });
      } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Internal server error",
          status: HTTP.INTERNAL_SERVER_ERROR,
        });
      }
    }
  };

  // Get employee by ID
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Employee ID is required", HTTP.BAD_REQUEST);
      }
      
      const result = await this.employeeService.getById(id);

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in get employee by ID:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode,
        });
      } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Internal server error",
          status: HTTP.INTERNAL_SERVER_ERROR,
        });
      }
    }
  };

  // Update employee
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Employee ID is required", HTTP.BAD_REQUEST);
      }
      
      const result = await this.employeeService.update(id, req.body);

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in update employee:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode,
        });
      } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Internal server error",
          status: HTTP.INTERNAL_SERVER_ERROR,
        });
      }
    }
  };

  // Soft delete employee
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Employee ID is required", HTTP.BAD_REQUEST);
      }
      
      const result = await this.employeeService.softDelete(id);

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in delete employee:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode,
        });
      } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Internal server error",
          status: HTTP.INTERNAL_SERVER_ERROR,
        });
      }
    }
  };

  // Toggle employee active status
  toggleStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError("Employee ID is required", HTTP.BAD_REQUEST);
      }
      
      const result = await this.employeeService.toggleIsActive(id);

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in toggle employee status:", error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode,
        });
      } else {
        res.status(HTTP.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Internal server error",
          status: HTTP.INTERNAL_SERVER_ERROR,
        });
      }
    }
  };
}