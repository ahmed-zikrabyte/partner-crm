import bcryptjs from "bcryptjs";
import { ENV } from "../../../../config/env";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { AdminModel } from "../../../../models/admin.model";
import type { ServiceResponse } from "../../../../typings";
import {
  generateAdminToken,
  getEmptyFields,
} from "../../../../utils/text.utils";

export default class AdminAuthService {
  private readonly adminModel = AdminModel;
  private readonly jwtSecret = ENV.jwt.secret;

  async login({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): ServiceResponse {
    try {
      const user = await this.adminModel.findOne({ email });

      if (!user) throw new AppError("User not found", 404);

      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) throw new AppError("Invalid credentials", 401);

      // Base token payload
      const payload: any = {
        id: user._id.toString(),
        role: user.role,
      };

      const token = generateAdminToken(payload);

      // Prepare sanitized admin object
      const sanitizedAdmin: any = {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      return {
        data: { token, admin: sanitizedAdmin },
        message: "Login successful",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async register({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): ServiceResponse {
    try {
      const emptyFields = getEmptyFields({ name, email, password });
      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields}`,
          HTTP.BAD_REQUEST
        );
      }

      const user = await this.adminModel.findOne({ email });
      if (user) throw new AppError("User already exists", HTTP.CONFLICT);

      const hashedPassword = bcryptjs.hashSync(password, 10);

      const newUser = await this.adminModel.create({
        name,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      return {
        message: "Register successful",
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;

      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
