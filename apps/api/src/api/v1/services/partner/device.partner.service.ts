import { DeviceModel, IDevice } from "../../../../models/device.model";
import { CompanyModel, ICompany } from "../../../../models/company.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";
import { VendorModel } from "../../../../models/vendor.model";
import { EmployeeModel } from "../../../../models/employee.model";
import { QRCodeUtil } from "../../../../utils/qrcode.util";

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
    issues,
    authorType,
    authorId,
  }: Partial<IDevice> & {
    partnerId: string;
    vendorId?: string;
    companyIds: string;
    brand: string;
    model: string;
    imei1: string;
    authorType: "partner" | "employee";
    authorId: string;
  }): Promise<ServiceResponse> {
    try {
      // Validate required fields (vendorId is now optional)
      const emptyFields = getEmptyFields({
        partnerId,
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
        issues,
        isActive: true,
      });

      await newDevice.save();

      // Generate QR code for the device
      const qrCodeDataUrl = await QRCodeUtil.generateDeviceQRCode(newDevice);
      newDevice.qrCodeUrl = qrCodeDataUrl;
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
      if (
        cleanUpdateData.vendorId &&
        typeof cleanUpdateData.vendorId === "object"
      ) {
        cleanUpdateData.vendorId =
          (cleanUpdateData.vendorId as any)._id || cleanUpdateData.vendorId;
      }
      if (
        cleanUpdateData.companyIds &&
        typeof cleanUpdateData.companyIds === "object"
      ) {
        cleanUpdateData.companyIds =
          (cleanUpdateData.companyIds as any)._id || cleanUpdateData.companyIds;
      }

      // Update the device
      const device = await this.deviceModel.findByIdAndUpdate(
        id,
        { ...cleanUpdateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      // Regenerate QR code with updated data
      if (device) {
        const qrCodeDataUrl = await QRCodeUtil.generateDeviceQRCode(device);
        device.qrCodeUrl = qrCodeDataUrl;
        await device.save();
      }

      // Update vendor balance - only for first-time addition since UI disables fields after first edit
      const newVendorId = cleanUpdateData.vendorId;

      // If vendor is being added for the first time (no old vendor but new vendor exists)
      if (!oldDevice.vendorId && newVendorId && newSelling > 0) {
        await VendorModel.findByIdAndUpdate(newVendorId, {
          $inc: { amount: newSelling },
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
    search?: string,
    filter?: any
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };
      if (partnerId) query.partnerId = partnerId;
      if (vendorId) query.vendorId = vendorId;
      if (companyIds) query.companyIds = companyIds;
      if (typeof isActive === "boolean") query.isActive = isActive;

      // Enhanced filtering
      if (filter) {
        if (filter.vendorId === null) {
          query.vendorId = null;
        } else if (filter.vendorId && filter.vendorId.$ne !== undefined) {
          query.vendorId = { $ne: null };
        } else if (filter.vendorId) {
          query.vendorId = filter.vendorId;
        }

        if (filter.companyIds) query.companyIds = filter.companyIds;
        if (filter.pickedBy) query.pickedBy = filter.pickedBy;
        if (filter.deviceType === "sold")
          query.selling = { $exists: true, $ne: null };
        if (filter.deviceType === "new") query.selling = { $exists: false };
      }

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

  async exportSoldDevices(
    partnerId: string,
    filters?: any
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = {
        isDeleted: false,
        partnerId,
        selling: { $exists: true, $ne: null },
      };

      if (filters?.vendorId) query.vendorId = filters.vendorId;
      if (filters?.companyIds) query.companyIds = filters.companyIds;
      if (filters?.pickedBy) query.pickedBy = filters.pickedBy;

      const devices = await this.deviceModel
        .find(query)
        .populate("vendorId", "name")
        .populate("companyIds", "name")
        .populate("pickedBy", "name")
        .sort({ createdAt: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };

      const exportData = devices.map((device) => ({
        'Device ID': device.deviceId,
        'Company': (device.companyIds as any)?.name || "N/A",
        'Company ID': (device.companyIds as any)?._id || "N/A",
        'Service Number': device.serviceNumber || 'N/A',
        'Brand': device.brand,
        'Model': device.model,
        'Box': device.box || 'N/A',
        'Warranty': device.warranty || 'N/A',
        'Issues': device.issues || 'N/A',
        'IMEI 1': device.imei1,
        'IMEI 2': device.imei2 || 'N/A',
        'Initial Cost': device.initialCost || 0,
        'Cost': device.cost || 0,
        'Extra Amount': device.extraAmount || 0,
        'Credits': device.credit || 0,
        'Per Credit Value': device.perCredit || 0,
        'Commission': device.commission || 0,
        'GST': device.gst || 0,
        'Total Cost': device.totalCost || 0,
        'Sold To': (device.vendorId as any)?.name || "N/A",
        'Selling Price': device.selling || 0,
        'Profit': device.profit || 0,
        'Picked By': (device.pickedBy as any)?.name || "N/A",
        'Picked Date': formatDate(device.date),
      }));

      return {
        data: exportData,
        message: "Sold devices exported successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async exportNewDevices(
    partnerId: string,
    filters?: any
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = {
        isDeleted: false,
        partnerId,
        $or: [{ selling: { $exists: false } }, { selling: null }],
      };

      if (filters?.vendorId) query.vendorId = filters.vendorId;
      if (filters?.companyIds) query.companyIds = filters.companyIds;
      if (filters?.pickedBy) query.pickedBy = filters.pickedBy;

      const devices = await this.deviceModel
        .find(query)
        .populate("vendorId", "name")
        .populate("companyIds", "name")
        .populate("pickedBy", "name")
        .sort({ createdAt: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };

      const exportData = devices.map((device) => ({
        'Device ID': device.deviceId,
        'Company': (device.companyIds as any)?.name || "N/A",
        'Company ID': (device.companyIds as any)?._id || "N/A",
        'Service Number': device.serviceNumber || 'N/A',
        'Brand': device.brand,
        'Model': device.model,
        'Box': device.box || 'N/A',
        'Warranty': device.warranty || 'N/A',
        'Issues': device.issues || 'N/A',
        'IMEI 1': device.imei1,
        'IMEI 2': device.imei2 || 'N/A',
        'Initial Cost': device.initialCost || 0,
        'Purchased Cost': device.cost || 0,
        'Extra Amount': device.extraAmount || 0,
        'Credits': device.credit || 0,
        'Per Credit Value': device.perCredit || 0,
        'Commission': device.commission || 0,
        'GST': device.gst || 0,
        'Total Cost': device.totalCost || 0,
        'Picked By': (device.pickedBy as any)?.name || "N/A",
        'Picked Date': formatDate(device.date),
        'Sold To': (device.vendorId as any)?.name || "N/A",
      }));

      return {
        data: exportData,
        message: "New devices exported successfully",
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
        isDeleted: false,
      })
        .select("name _id")
        .sort({ name: 1 });

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

  async generateQRCode(id: string): Promise<ServiceResponse> {
    try {
      const device = await this.deviceModel.findById(id);
      if (!device) throw new AppError("Device not found", HTTP.NOT_FOUND);

      const qrCodeDataUrl = await QRCodeUtil.generateDeviceQRCode(device);
      device.qrCodeUrl = qrCodeDataUrl;
      await device.save();

      return {
        data: { qrCodeUrl: qrCodeDataUrl },
        message: "QR code generated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
