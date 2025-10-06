import express from "express";
import DashboardController from "../../controllers/partner/dashboard.partner.controller";

const dashboardRouter: express.Router = express.Router();
const dashboardController = new DashboardController();

dashboardRouter.get("/stats", dashboardController.getDashboardStats);

export default dashboardRouter;