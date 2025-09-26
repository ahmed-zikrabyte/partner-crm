import type { Request, Response } from "express";
import CompanyService from "../../services/partner/company.partner.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class CompanyController {
  private companyService = new CompanyService();

  create = catchAsync(async (req: Request, res: Response) => {
    const { name, creditValue, companyIds } = req.body;
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;

    const response = await this.companyService.create({
      partnerId,
      name,
      creditValue,
      companyIds,
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

    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;

    // Convert query params to numbers and handle undefined properly
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const response = await this.companyService.getAll(
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

  // Get company by ID
  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.companyService.getById(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  // Update a company
  update = catchAsync(async (req: Request, res: Response) => {
    const response = await this.companyService.update(
      req.params.id as string,
      req.body
    );
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  // Soft delete a company
  softDelete = catchAsync(async (req: Request, res: Response) => {
    const response = await this.companyService.softDelete(
      req.params.id as string
    );
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  // Toggle isActive for a company
  toggleIsActive = catchAsync(async (req: Request, res: Response) => {
    const response = await this.companyService.toggleIsActive(
      req.params.id as string
    );
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });
}
