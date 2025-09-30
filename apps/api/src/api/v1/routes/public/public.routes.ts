import express from "express";
import publicDeviceRouter from "./device.public.routes";

const publicRoutes: express.Router = express.Router();

publicRoutes.use("/device", publicDeviceRouter);

export default publicRoutes;
