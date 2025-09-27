import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { AdminModel } from "../models/admin.model";
import { ApiResponse } from "../utils/response.util";

declare global {
  namespace Express {
    interface Request {
      admin?: any;
      adminRole?: string;
    }
  }
}

/**
 * Protect Super Admin Routes
 * Verifies token, checks if admin is super-admin, attaches admin to req
 */
export const protectSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Extract token from Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ApiResponse.unauthorized({
        res,
        message: "Not authorized to access this route",
      });
    }

    // Decode token
    const decoded = jwt.verify(token, ENV.jwt.secret) as jwt.JwtPayload;

    // Find admin
    const adminDoc = await AdminModel.findById(decoded.id);
    if (!adminDoc) {
      return ApiResponse.unauthorized({
        res,
        message: "Admin not found",
      });
    }

    // Check role
    if (adminDoc.role !== "super-admin") {
      return ApiResponse.forbidden({
        res,
        message: "You do not have permission to perform this action",
      });
    }

    // Attach to request
    req.admin = adminDoc;
    req.adminRole = adminDoc.role;

    next();
  } catch (error) {
    console.error("SuperAdmin Auth Error:", error);
    return ApiResponse.unauthorized({
      res,
      message: "Not authorized to access this route",
    });
  }
};
