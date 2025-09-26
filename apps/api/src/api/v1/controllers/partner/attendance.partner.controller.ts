import { Request, Response } from "express";
import AttendancePartnerService from "../../services/partner/attendance.partner.service";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";

export default class AttendanceController {
  private attendanceService = new AttendancePartnerService();

  // Mark attendance
  markAttendance = async (req: Request, res: Response) => {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        throw new AppError("Partner ID is required", HTTP.UNAUTHORIZED);
      }

      const { employeeId, date, status } = req.body;

      const result = await this.attendanceService.markAttendance(
        partnerId,
        employeeId,
        date,
        status
      );

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in mark attendance:", error);
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

  // Get employee attendance
  getEmployeeAttendance = async (req: Request, res: Response) => {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        throw new AppError("Partner ID is required", HTTP.UNAUTHORIZED);
      }

      const { employeeId } = req.params;
      if (!employeeId) {
        throw new AppError("Employee ID is required", HTTP.BAD_REQUEST);
      }

      const { startDate, endDate } = req.query;

      const result = await this.attendanceService.getEmployeeAttendance(
        partnerId,
        employeeId,
        startDate as string,
        endDate as string
      );

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in get employee attendance:", error);
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

  // Get all employees attendance
  getAllEmployeesAttendance = async (req: Request, res: Response) => {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        throw new AppError("Partner ID is required", HTTP.UNAUTHORIZED);
      }

      const { date } = req.query;
      if (!date) {
        throw new AppError("Date is required", HTTP.BAD_REQUEST);
      }

      const result = await this.attendanceService.getAllEmployeesAttendance(
        partnerId,
        date as string
      );

      res.status(result.status).json(result);
    } catch (error) {
      console.error("Error in get all employees attendance:", error);
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

  // Export attendance to Excel
  exportAttendanceToExcel = async (req: Request, res: Response) => {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        throw new AppError("Partner ID is required", HTTP.UNAUTHORIZED);
      }

      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        throw new AppError("Start date and end date are required", HTTP.BAD_REQUEST);
      }

      const buffer = await this.attendanceService.exportAttendanceToExcel(
        partnerId,
        startDate as string,
        endDate as string
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=attendance-${startDate}-to-${endDate}.xlsx`
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error in export attendance:", error);
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