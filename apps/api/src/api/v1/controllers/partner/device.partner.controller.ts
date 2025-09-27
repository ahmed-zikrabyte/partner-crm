import type { Request, Response } from "express";
import DeviceService from "../../services/partner/device.partner.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class DeviceController {
  private deviceService = new DeviceService();

  create = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;
    const authorType = user.role === "partner" ? "partner" : "employee";
    const authorId = user._id;
    
    // If employee is creating, set pickedBy to themselves by default
    const pickedBy = user.role === "employee" ? user._id : req.body.pickedBy;

    const response = await this.deviceService.create({
      partnerId,
      authorType,
      authorId,
      pickedBy,
      ...req.body,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = "1", limit = "10", vendorId, companyIds, isActive, search, filter } = req.query;
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;

    let parsedFilter;
    if (filter && typeof filter === 'string') {
      try {
        parsedFilter = JSON.parse(filter);
      } catch (e) {
        parsedFilter = undefined;
      }
    }

    const response = await this.deviceService.getAll(
      Number(page),
      Number(limit),
      partnerId as string,
      vendorId as string,
      companyIds as string,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      search as string | undefined,
      parsedFilter
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.deviceService.getById(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const response = await this.deviceService.update(req.params.id as string, req.body);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  softDelete = catchAsync(async (req: Request, res: Response) => {
    const response = await this.deviceService.softDelete(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  toggleIsActive = catchAsync(async (req: Request, res: Response) => {
    const response = await this.deviceService.toggleIsActive(req.params.id as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  getEmployees = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;
    
    const response = await this.deviceService.getEmployeesByPartner(partnerId as string);
    return ApiResponse.success({
      res,
      ...response,
      statusCode: response.status,
    });
  });

  exportSoldDevices = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;
    const { vendorId, companyIds, pickedBy } = req.query;

    const filters = {
      ...(vendorId && { vendorId }),
      ...(companyIds && { companyIds }),
      ...(pickedBy && { pickedBy })
    };

    const response = await this.deviceService.exportSoldDevices(partnerId as string, filters);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  exportNewDevices = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;
    const { vendorId, companyIds, pickedBy } = req.query;

    const filters = {
      ...(vendorId && { vendorId }),
      ...(companyIds && { companyIds }),
      ...(pickedBy && { pickedBy })
    };

    const response = await this.deviceService.exportNewDevices(partnerId as string, filters);
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
