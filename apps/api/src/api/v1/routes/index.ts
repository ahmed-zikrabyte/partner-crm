import express from "express";
import adminRoutes from "./admin/admin.routes";
import partnerRoutes from "./partner/partner.route";
import publicDeviceRoutes from "./public/device.public.routes";

const v1Routes: express.Router = express.Router();

v1Routes.use("/admin", adminRoutes);
v1Routes.use("/partner", partnerRoutes);
v1Routes.use("/public/device", publicDeviceRoutes);

export default v1Routes;
