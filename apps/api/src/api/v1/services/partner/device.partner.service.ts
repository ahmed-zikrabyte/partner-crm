import { DeviceModel, IDevice } from "../../../../models/device.model";
import { CompanyModel, ICompany } from "../../../../models/company.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";
import { VendorModel } from "../../../../models/vendor.model";
import { EmployeeModel } from "../../../../models/employee.model";

export default class DeviceService {
  private deviceModel = DeviceModel;
  private companyModel = CompanyModel;

  async create({
    partnerId,
    vendorId,
    companyIds,
    selectedCompanyIds,
    brand,
    model,
    imei1,
    imei2,
    initialCost,
    cost,
    extraAmount,
    credit,
    perCredit,
    commission,
    gst,
    totalCost,
    selling,
    profit,
    pickedBy,
    date,
    serviceNumber,
    box,
    warranty,
    authorType,
    authorId,
  }: Partial<IDevice> & {
    partnerId: string;
    vendorId: string;
    companyIds: string;
    brand: string;
    model: string;
    imei1: string;
    authorType: "partner" | "employee";
    authorId: string;
  }): Promise<ServiceResponse> {
    try {
      // Validate required fields
      const emptyFields = getEmptyFields({
        partnerId,
        vendorId,
        companyIds,
        brand,
        model,
        imei1,
      });
      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields}`,
          HTTP.BAD_REQUEST
        );
      }

      // Ensure company exists
      const company = await this.companyModel.findById(companyIds);
      if (!company) throw new AppError("Company not found", HTTP.NOT_FOUND);

      // Create the device
      const newDevice = await this.deviceModel.create({
        partnerId,
        vendorId,
        companyIds,
        selectedCompanyIds,
        author: {
          authorType,
          authorId,
        },
        brand,
        model,
        imei1,
        imei2,
        initialCost,
        cost,
        extraAmount,
        credit,
        perCredit,
        commission,
        gst,
        totalCost,
        selling,
        profit,
        date,
        pickedBy,
        serviceNumber,
        box,
        warranty,
        isActive: true,
      });

      await newDevice.save();

      // Update vendor balance
      if (selling && vendorId) {
        await VendorModel.findByIdAndUpdate(vendorId, {
          $inc: { amount: selling },
        });
      }

      return {
        message: "Device created successfully",
        data: newDevice,
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async update(
    id: string,
    updateData: Partial<IDevice>
  ): Promise<ServiceResponse> {
    try {
      const oldDevice = await this.deviceModel.findById(id);
      if (!oldDevice) throw new AppError("Device not found", HTTP.NOT_FOUND);

      const oldSelling = oldDevice.selling || 0;
      const newSelling = updateData.selling || oldSelling;

      // Clean updateData to ensure IDs are strings, not objects
      const cleanUpdateData = { ...updateData };
      if (cleanUpdateData.vendorId && typeof cleanUpdateData.vendorId === 'object') {
        cleanUpdateData.vendorId = (cleanUpdateData.vendorId as any)._id || cleanUpdateData.vendorId;
      }
      if (cleanUpdateData.companyIds && typeof cleanUpdateData.companyIds === 'object') {
        cleanUpdateData.companyIds = (cleanUpdateData.companyIds as any)._id || cleanUpdateData.companyIds;
      }

      // Update the device
      const device = await this.deviceModel.findByIdAndUpdate(
        id,
        { ...cleanUpdateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      // Update vendor balance if selling changed
      if (oldDevice.vendorId && oldSelling !== newSelling) {
        const diff = newSelling - oldSelling;
        await VendorModel.findByIdAndUpdate(oldDevice.vendorId, {
          $inc: { amount: diff },
        });
      }

      return {
        message: "Device updated successfully",
        data: device,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(
    page: number = 1,
    limit: number = 10,
    partnerId?: string,
    vendorId?: string,
    companyIds?: string,
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };
      if (partnerId) query.partnerId = partnerId;
      if (vendorId) query.vendorId = vendorId;
      if (companyIds) query.companyId = companyIds;
      if (typeof isActive === "boolean") query.isActive = isActive;
      if (search)
        query.$or = [
          { brand: { $regex: search, $options: "i" } },
          { model: { $regex: search, $options: "i" } },
          { imei1: { $regex: search, $options: "i" } },
          { imei2: { $regex: search, $options: "i" } },
        ];

      const skip = (page - 1) * limit;
      const fetchQuery = this.deviceModel.find(query).sort({ createdAt: -1 });
      if (limit !== 0) fetchQuery.skip(skip).limit(limit);

      const [devices, total] = await Promise.all([
        fetchQuery
          .populate("vendorId", "name")
          .populate("companyIds", "name")
          .populate("author.authorId", "name")
          .populate("pickedBy", "name"),
        this.deviceModel.countDocuments(query),
      ]);

      const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);

      return {
        data: {
          devices,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit === 0 ? total : limit,
            hasNext: limit === 0 ? false : page < totalPages,
            hasPrev: limit === 0 ? false : page > 1,
          },
        },
        message: "Devices fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(id: string): Promise<ServiceResponse> {
    try {
      const device = await this.deviceModel.findById(id);
      if (!device) throw new AppError("Device not found", HTTP.NOT_FOUND);

      return {
        data: device,
        message: "Device fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
  async softDelete(id: string): Promise<ServiceResponse> {
    try {
      const device = await this.deviceModel.findById(id);
      if (!device) throw new AppError("Device not found", HTTP.NOT_FOUND);

      // Deduct the device selling from vendor balance
      const vendor = await VendorModel.findById(device.vendorId);
      if (vendor) {
        vendor.amount = (vendor.amount || 0) - (device.selling || 0);
        await vendor.save();
      }

      // Soft delete the device
      device.isDeleted = true;
      await device.save();

      return {
        message: "Device deleted successfully and vendor balance updated",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleIsActive(id: string): Promise<ServiceResponse> {
    try {
      const device = await this.deviceModel.findById(id);
      if (!device) throw new AppError("Device not found", HTTP.NOT_FOUND);

      device.isActive = !device.isActive;
      await device.save();

      return {
        data: device,
        message: `Device is now ${device.isActive ? "active" : "inactive"}`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getEmployeesByPartner(partnerId: string): Promise<ServiceResponse> {
    try {
      const employees = await EmployeeModel.find({
        partnerId,
        isActive: true,
        isDeleted: false,
      }).select("_id name");

      return {
        data: employees,
        message: "Employees fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
