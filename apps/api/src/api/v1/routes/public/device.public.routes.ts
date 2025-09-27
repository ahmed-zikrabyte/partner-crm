import express, { type NextFunction, type Request, type Response, type Router } from "express";
import PublicDeviceController from "../../controllers/public/device.public.controller";

const publicDeviceRouter: Router = express.Router();
const publicDeviceController = new PublicDeviceController();

// Get device by ID (public access for QR codes)
publicDeviceRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  publicDeviceController.getById(req, res, next)
);

export default publicDeviceRouter;