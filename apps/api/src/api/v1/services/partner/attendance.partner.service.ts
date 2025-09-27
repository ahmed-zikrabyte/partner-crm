import {
  AttendanceModel,
  IAttendance,
} from "../../../../models/attendance.model";
import { EmployeeModel } from "../../../../models/employee.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import type { ServiceResponse } from "../../../../typings";
import * as ExcelJS from "exceljs";

export default class AttendancePartnerService {
  private attendanceModel = AttendanceModel;
  private employeeModel = EmployeeModel;

  async markAttendance(
    partnerId: string,
    employeeId: string,
    date: string,
    status: "Present" | "Absent"
  ): Promise<ServiceResponse> {
    try {
      // Verify employee belongs to partner
      const employee = await this.employeeModel.findOne({
        _id: employeeId,
        partnerId,
        isDeleted: false,
      });

      if (!employee) {
        throw new AppError(
          "Employee not found or unauthorized",
          HTTP.NOT_FOUND
        );
      }

      const attendanceDate = new Date(date + 'T00:00:00.000Z');

      // Update or create attendance
      const attendance = await this.attendanceModel.findOneAndUpdate(
        { employeeId, date: attendanceDate },
        { partnerId, employeeId, date: attendanceDate, status },
        { upsert: true, new: true }
      );

      return {
        message: "Attendance marked successfully",
        data: attendance,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getEmployeeAttendance(
    partnerId: string,
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResponse> {
    try {
      const employee = await this.employeeModel.findOne({
        _id: employeeId,
        partnerId,
        isDeleted: false,
      });

      if (!employee) {
        throw new AppError(
          "Employee not found or unauthorized",
          HTTP.NOT_FOUND
        );
      }

      const query: any = { employeeId };

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const attendance = await this.attendanceModel
        .find(query)
        .populate("employeeId", "name email")
        .sort({ date: -1 });

      return {
        message: "Employee attendance retrieved successfully",
        data: attendance,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllEmployeesAttendance(
    partnerId: string,
    date: string
  ): Promise<ServiceResponse> {
    try {
      const attendanceDate = new Date(date + 'T00:00:00.000Z');

      const employees = await this.employeeModel
        .find({
          partnerId,
          isDeleted: false,
        })
        .select("name email");

      const attendance = await this.attendanceModel
        .find({
          partnerId,
          date: attendanceDate,
        })
        .populate("employeeId", "name email");

      return {
        message: "All employees attendance retrieved successfully",
        data: { employees, attendance },
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async exportAttendanceToExcel(
    partnerId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // 1. Validate start and end
      if (!startDate || !endDate) {
        throw new AppError(
          "Start and end dates are required",
          HTTP.BAD_REQUEST
        );
      }

      // 2. Get employees
      const employees = await this.employeeModel
        .find({ partnerId, isDeleted: false })
        .select("name email phone salaryPerDay");

      // 3. Attendance query
      const query: any = { partnerId };
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);

      const attendance = await this.attendanceModel.find(query);

      // 4. Generate date range safely
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateRange: string[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        // clone date for safety
        dateRange.push(new Date(d).toISOString().substring(0, 10));
      }

      // 5. ExcelJS workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendance Report");

      // 6. Columns
      const columns: any[] = [
        { header: "Employee Name", key: "name", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Salary Per Day", key: "salaryPerDay", width: 15 },
      ];

      // Add date columns dynamically
      dateRange.forEach((date) => {
        columns.push({
          header: new Date(date).toLocaleDateString(),
          key: date,
          width: 12,
        });
      });

      worksheet.columns = columns;

      // 7. Rows (employees)
      employees.forEach((employee: any) => {
        const row: any = {
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          salaryPerDay: employee.salaryPerDay,
        };

        // Add attendance status for each date
        dateRange.forEach((date) => {
          const attendanceRecord = attendance.find(
            (record: any) => {
              const recordDateStr = record.date.toISOString().substring(0, 10);
              return record.employeeId.toString() === employee._id.toString() &&
                recordDateStr === date;
            }
          );
          row[date] = attendanceRecord ? attendanceRecord.status : "Not Marked";
        });

        worksheet.addRow(row);
      });

      // 8. Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // 9. Return buffer
      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
