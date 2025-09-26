import type { Request, Response } from "express";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { PartnerAuthService } from "../../services/partner/auth.partner.service";

export default class PartnerAuthController {
  private authService = new PartnerAuthService();

  /** PARTNER LOGIN */
  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const response = await this.authService.login({ email, password });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  /** EMPLOYEE LOGIN */
  employeeLogin = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const response = await this.authService.employeeLogin({ email, password });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  /** GET CURRENT USER */
  getCurrentUser = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    
    return ApiResponse.success({
      res,
      message: "User fetched successfully",
      data: user,
      statusCode: 200,
    });
  });
}
