import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import AppError from "./utils/AppError";
import { errorHandler } from "./middleware/error.middleware";
import v1Router from "./api/v1";
import { ENV } from "./config/env";
import mongoose from "mongoose";
import { allowedOrigins } from "./config/origins.config";

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const limiter = rateLimit({
//   windowMs: ENV.rateLimit.windowMs,
//   max: ENV.rateLimit.max,
//   message: "Too many requests from this IP, please try again after 15 minutes",
// });

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Partner CRM Server is running",
  });
});

// app.use("/api", limiter);

// Routes
app.use("/api", v1Router);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

mongoose
  .connect(ENV.db.mongoUri)
  .then(() => {
    console.log("MongoDB connected ✅");
    const server = app.listen(ENV.app.port, () => {
      console.log(`Server is running on port ${ENV.app.port}`);
    });

    process.on("unhandledRejection", (err: Error) => {
      console.log("UNHANDLED REJECTION! 💥 Shutting down...");
      console.log(err.name, err.message);
      server.close(() => process.exit(1));
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error ❌", err);
    process.exit(1);
  });
