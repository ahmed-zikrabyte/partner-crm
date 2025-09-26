import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { PartnerModel } from "../models/partner.model";
import { EmployeeModel } from "../models/employee.model";
import { ApiResponse } from "../utils/response.util";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userRole?: string;
      userType?: "partner" | "employee";
    }
  }
}

/**
 * Protect User Routes
 * Verifies token and attaches user to req (partner or employee)
 */
export const protectUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return ApiResponse.unauthorized({
        res,
        message: "Not authorized to access this route",
      });
    }

    const decoded = jwt.verify(token, ENV.jwt.secret) as jwt.JwtPayload;

    // Try finding the user in partners first
    let userDoc = await PartnerModel.findById(decoded.id);
    if (userDoc) {
      req.user = userDoc;
      req.userRole = userDoc.role;
      req.userType = "partner";
      return next();
    }

    // If not found, try employees
    userDoc = await EmployeeModel.findById(decoded.id);
    if (userDoc) {
      req.user = userDoc;
      req.userRole = userDoc.role;
      req.userType = "employee";
      return next();
    }

    return ApiResponse.unauthorized({
      res,
      message: "User not found",
    });
  } catch (error) {
    console.error("Auth Error:", error);
    return ApiResponse.unauthorized({
      res,
      message: "Not authorized to access this route",
    });
  }
};

/**
 * Restrict routes by role (partner or employee)
 * Example: restrictUserTo('partner') or restrictUserTo('employee')
 */
export const restrictUserTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.unauthorized({
        res,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.userRole!)) {
      return ApiResponse.forbidden({
        res,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
