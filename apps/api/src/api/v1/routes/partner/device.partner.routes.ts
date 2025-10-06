import express, { type NextFunction, type Request, type Response, type Router } from "express";
import DeviceController from "../../controllers/partner/device.partner.controller";

const deviceRouter: Router = express.Router();
const deviceController = new DeviceController();

// Create device
deviceRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  deviceController.create(req, res, next)
);

// Get all devices (with pagination, search, filter)
deviceRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  deviceController.getAll(req, res, next)
);

// Get device by ID
deviceRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  deviceController.getById(req, res, next)
);

// Update device
deviceRouter.patch("/:id", (req: Request, res: Response, next: NextFunction) =>
  deviceController.update(req, res, next)
);

// Toggle device status
deviceRouter.patch("/toggle/:id", (req: Request, res: Response, next: NextFunction) =>
  deviceController.toggleIsActive(req, res, next)
);

// Soft delete device
deviceRouter.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
  deviceController.softDelete(req, res, next)
);

// Get employees for partner
deviceRouter.get("/employees/list", (req: Request, res: Response, next: NextFunction) =>
  deviceController.getEmployees(req, res, next)
);

// Export sold devices
deviceRouter.get("/export/sold", (req: Request, res: Response, next: NextFunction) =>
  deviceController.exportSoldDevices(req, res, next)
);

// Export new devices
deviceRouter.get("/export/new", (req: Request, res: Response, next: NextFunction) =>
  deviceController.exportNewDevices(req, res, next)
);

// Export return devices
deviceRouter.get("/export/return", (req: Request, res: Response, next: NextFunction) =>
  deviceController.exportReturnDevices(req, res, next)
);

// Export employee devices
deviceRouter.get("/export/employee", (req: Request, res: Response, next: NextFunction) =>
  deviceController.exportEmployeeDevices(req, res, next)
);

export default deviceRouter;
