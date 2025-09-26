import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";
import PartnerAuthController from "../../controllers/admin/partner.admin.controller";

const partnerAuthRouter: Router = express.Router();
const partnerAuthController = new PartnerAuthController();

partnerAuthRouter.post(
  "/register",
  (req: Request, res: Response, next: NextFunction) =>
    partnerAuthController.register(req, res, next)
);

partnerAuthRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  partnerAuthController.getAll(req, res, next)
);

partnerAuthRouter.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    partnerAuthController.getById(req, res, next)
);

partnerAuthRouter.patch(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    partnerAuthController.update(req, res, next)
);

partnerAuthRouter.patch(
  "/toggle/:id",
  (req: Request, res: Response, next: NextFunction) =>
    partnerAuthController.toggleIsActive(req, res, next)
);

partnerAuthRouter.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    partnerAuthController.softDelete(req, res, next)
);

export default partnerAuthRouter;
