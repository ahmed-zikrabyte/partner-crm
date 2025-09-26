import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";
import AdminAuthController from "../../controllers/admin/auth.admin.controller";

const adminAuthRouter: Router = express.Router();
const adminAuthController = new AdminAuthController();

adminAuthRouter.post(
  "/login",
  (req: Request, res: Response, next: NextFunction) =>
    adminAuthController.login(req, res, next)
);

adminAuthRouter.post(
  "/register",
  (req: Request, res: Response, next: NextFunction) =>
    adminAuthController.register(req, res, next)
);

export default adminAuthRouter;
