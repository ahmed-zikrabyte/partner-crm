import express from "express";
import AuthController from "../../controllers/partner/auth.partner.controller";
import { protectUser } from "../../../../middleware/partnerAuth.middleware";

const partnerAuthRouter: express.Router = express.Router();
const authController = new AuthController();

partnerAuthRouter.post("/login", authController.login);
partnerAuthRouter.post("/employee-login", authController.employeeLogin);

// Protected routes
partnerAuthRouter.get("/me", protectUser, authController.getCurrentUser);
partnerAuthRouter.get("/profile", protectUser, authController.getPartnerProfile);
partnerAuthRouter.get("/employee-profile", protectUser, authController.getEmployeeProfile);

export default partnerAuthRouter;
