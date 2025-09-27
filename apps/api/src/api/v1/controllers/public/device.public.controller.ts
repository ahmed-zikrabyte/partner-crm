import type { Request, Response } from "express";
import { DeviceModel } from "../../../../models/device.model";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";

export default class PublicDeviceController {
  getById = catchAsync(async (req: Request, res: Response) => {
    const device = await DeviceModel.findById(req.params.id)
      .populate("vendorId", "name")
      .populate("companyIds", "name")
      .populate("pickedBy", "name");
      
    if (!device) {
      throw new AppError("Device not found", HTTP.NOT_FOUND);
    }

    return ApiResponse.success({
      res,
      message: "Device fetched successfully",
      data: device,
      statusCode: HTTP.OK,
    });
  });
}