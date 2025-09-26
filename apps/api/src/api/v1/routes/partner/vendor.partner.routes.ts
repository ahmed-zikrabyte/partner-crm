import express, { type NextFunction, type Request, type Response, type Router } from "express";
import VendorController from "../../controllers/partner/vendor.partner.controller";

const vendorRouter: Router = express.Router();
const vendorController = new VendorController();

// Create a vendor
vendorRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  vendorController.create(req, res, next)
);

// Get all vendors
vendorRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  vendorController.getAll(req, res, next)
);

// Get a vendor by ID
vendorRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  vendorController.getById(req, res, next)
);

// Update a vendor
vendorRouter.patch("/:id", (req: Request, res: Response, next: NextFunction) =>
  vendorController.update(req, res, next)
);

// Toggle isActive for a vendor
vendorRouter.patch("/toggle/:id", (req: Request, res: Response, next: NextFunction) =>
  vendorController.toggleIsActive(req, res, next)
);

// Soft delete a vendor
vendorRouter.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
  vendorController.softDelete(req, res, next)
);

export default vendorRouter;
