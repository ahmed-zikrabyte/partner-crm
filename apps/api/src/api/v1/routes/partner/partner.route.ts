import express from "express";
import {
  protectUser,
  restrictUserTo,
} from "../../../../middleware/partnerAuth.middleware";
import partnerAuthRouter from "./auth.partner.routes";
import companyAuthRouter from "./company.partner.routes";
import vendorRouter from "./vendor.partner.routes";
import deviceRouter from "./device.partner.routes";
import employeeRouter from "./employee.partner.routes";
import attendanceRouter from "./attendance.partner.routes";
import transactionRouter from "./transaction.partner.routes";

const partnerRoutes: express.Router = express.Router();

partnerRoutes.use("/auth", partnerAuthRouter);

partnerRoutes.use(protectUser);

partnerRoutes.use("/employees", restrictUserTo("partner"), employeeRouter);
partnerRoutes.use("/attendance", restrictUserTo("partner"), attendanceRouter);
partnerRoutes.use("/companies", companyAuthRouter);
partnerRoutes.use("/vendors", vendorRouter);
partnerRoutes.use("/devices", deviceRouter);
partnerRoutes.use("/transaction", transactionRouter);

export default partnerRoutes;
