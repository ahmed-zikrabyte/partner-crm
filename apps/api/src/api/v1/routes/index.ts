import express from "express";
import adminRoutes from "./admin/admin.routes";
import partnerRoutes from "./partner/partner.route";

const v1Routes: express.Router = express.Router();

v1Routes.use("/admin", adminRoutes);
v1Routes.use("/partner", partnerRoutes);

export default v1Routes;
