import { DeviceModel } from "../../../../models/device.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import type { ServiceResponse } from "../../../../typings";

export default class PublicDeviceService {
  private deviceModel = DeviceModel;

  async getById(id: string): Promise<ServiceResponse> {
    try {
      const device = await this.deviceModel
        .findById(id)
        .populate("vendorId", "name")
        .populate("companyIds", "name")
        .populate("pickedBy", "name");
        
      if (!device) {
        throw new AppError("Device not found", HTTP.NOT_FOUND);
      }

      return {
        data: device,
        message: "Device fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}