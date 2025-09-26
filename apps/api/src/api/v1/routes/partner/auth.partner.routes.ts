import express from "express";
import AuthController from "../../controllers/partner/auth.partner.controller";
import { protectUser } from "../../../../middleware/partnerAuth.middleware";

const partnerAuthRouter: express.Router = express.Router();
const authController = new AuthController();

partnerAuthRouter.post("/login", authController.login);
partnerAuthRouter.post("/employee-login", authController.employeeLogin);

// Protected route
partnerAuthRouter.get("/me", protectUser, authController.getCurrentUser);

export default partnerAuthRouter;
