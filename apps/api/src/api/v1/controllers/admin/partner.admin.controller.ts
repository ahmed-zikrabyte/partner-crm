import type { Request, Response } from "express";
import PartnerAuthService from "../../services/admin/partner.admin.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class PartnerAuthController {
  private authService = new PartnerAuthService();

  register = catchAsync(async (req: Request, res: Response) => {
    const { name, email, phone, password } = req.body;
    const response = await this.authService.register({
      name,
      email,
      phone,
      password,
    });
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = "1", limit = "10", isActive, search } = req.query;

    const response = await this.authService.getAll(
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      (search as string) || undefined
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.authService.getById(req.params.id as string);

    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const response = await this.authService.update(
      req.params.id as string,
      req.body
    );
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  softDelete = catchAsync(async (req: Request, res: Response) => {
    const response = await this.authService.softDelete(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  toggleIsActive = catchAsync(async (req: Request, res: Response) => {
    const response = await this.authService.toggleIsActive(
      req.params.id as string
    );
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });
}
