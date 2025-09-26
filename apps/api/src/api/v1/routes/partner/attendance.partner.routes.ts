import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";
import AttendanceController from "../../controllers/partner/attendance.partner.controller";

const attendanceRouter: Router = express.Router();
const attendanceController = new AttendanceController();

// Mark attendance for an employee
attendanceRouter.post("/mark", (req: Request, res: Response, next: NextFunction) =>
  attendanceController.markAttendance(req, res)
);

// Get attendance for a specific employee
attendanceRouter.get("/employee/:employeeId", (req, res, next) =>
  attendanceController.getEmployeeAttendance(req, res)
);

// Get attendance for all employees on a specific date
attendanceRouter.get("/all", (req, res, next) =>
  attendanceController.getAllEmployeesAttendance(req, res)
);

// Export attendance to Excel with date filtering
attendanceRouter.get("/export", (req, res, next) =>
  attendanceController.exportAttendanceToExcel(req, res)
);

export default attendanceRouter;