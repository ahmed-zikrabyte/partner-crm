import type { Request, Response } from "express";
import VendorService from "../../services/partner/vendor.partner.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class VendorController {
  private vendorService = new VendorService();

  create = catchAsync(async (req: Request, res: Response) => {
    const { name, amount } = req.body;
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;

    const response = await this.vendorService.create({ partnerId, name, amount });
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = "1", limit = "10", isActive, search } = req.query;
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const response = await this.vendorService.getAll(
      pageNumber,
      limitNumber,
      partnerId as string,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      search as string | undefined
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.vendorService.getById(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const response = await this.vendorService.update(req.params.id as string, req.body);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  softDelete = catchAsync(async (req: Request, res: Response) => {
    const response = await this.vendorService.softDelete(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  toggleIsActive = catchAsync(async (req: Request, res: Response) => {
    const response = await this.vendorService.toggleIsActive(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });
}
