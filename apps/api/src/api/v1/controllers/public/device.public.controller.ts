import type { Request, Response } from "express";
import PublicDeviceService from "../../services/public/device.public.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class PublicDeviceController {
  private deviceService = new PublicDeviceService();

  getById = catchAsync(async (req: Request, res: Response) => {
    const response = await this.deviceService.getById(req.params.id as string);
    
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}