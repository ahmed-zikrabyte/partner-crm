import express from "express";
import v1Routes from "./routes/index";

const router: express.Router = express.Router();

router.use(`/v1`, v1Routes);

export default router;
