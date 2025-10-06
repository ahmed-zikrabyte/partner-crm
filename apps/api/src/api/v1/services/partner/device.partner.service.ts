import { DeviceModel, IDevice } from "../../../../models/device.model";
import { CompanyModel, ICompany } from "../../../../models/company.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";
import { VendorModel } from "../../../../models/vendor.model";
import { EmployeeModel } from "../../../../models/employee.model";

import mongoose from "mongoose";

export default class DeviceService {
  private deviceModel = DeviceModel;
  private companyModel = CompanyModel;

  async create({
    partnerId,
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
    profit,
    pickedBy,
    date,
    serviceNumber,
    box,
    warranty,
    issues,
    authorType,
    authorId,
    selling,
    soldTo,
  }: Partial<IDevice> & {
    partnerId: string;
    companyIds: string;
    brand: string;
    model: string;
    imei1: string;
    authorType: "partner" | "employee";
    authorId: string;
    selling?: number;
    soldTo?: string;
  }): Promise<ServiceResponse> {
    try {
      // Validate required fields
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
      const deviceData: any = {
        partnerId,
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
        profit,
        date,
        pickedBy,
        serviceNumber,
        box,
        warranty,
        issues,
        isActive: true,
      };

      // Add to sellHistory if selling and soldTo are provided
      if (selling && soldTo) {
        deviceData.sellHistory = [
          {
            type: "sell" as const,
            vendor: new mongoose.Types.ObjectId(soldTo),
            selling: selling,
            createdAt: new Date(),
          },
        ];

        // Add selling amount to vendor's amount
        await VendorModel.findByIdAndUpdate(soldTo, {
          $inc: { amount: selling },
        });
      }

      const newDevice = await this.deviceModel.create(deviceData);

      await newDevice.save();

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
    updateData: Partial<IDevice> & {
      selling?: number;
      soldTo?: string;
    }
  ): Promise<ServiceResponse> {
    try {
      const oldDevice = await this.deviceModel.findById(id);
      if (!oldDevice) throw new AppError("Device not found", HTTP.NOT_FOUND);

      // Clean updateData to ensure IDs are strings, not objects
      const cleanUpdateData = { ...updateData };
      if (
        cleanUpdateData.companyIds &&
        typeof cleanUpdateData.companyIds === "object"
      ) {
        cleanUpdateData.companyIds =
          (cleanUpdateData.companyIds as any)._id || cleanUpdateData.companyIds;
      }

      const {
        selling,
        soldTo,
        ...deviceUpdateData
      } = cleanUpdateData;

      // Handle sell or return based on current device state
      if (selling && soldTo) {
        const currentHistory = oldDevice.sellHistory || [];
        const lastEntry = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;
        
        // Determine if this is a sell or return based on last entry
        let transactionType: "sell" | "return" = "sell";
        if (lastEntry?.type === "sell") {
          transactionType = "return";
        }
        
        const newTransaction = {
          type: transactionType,
          vendor: new mongoose.Types.ObjectId(soldTo),
          ...(transactionType === "sell" ? { selling } : { returnAmount: selling }),
          createdAt: new Date(),
        };

        deviceUpdateData.sellHistory = [
          ...currentHistory,
          newTransaction,
        ];

        // Update vendor amount
        const amountChange = transactionType === "sell" ? selling : -selling;
        await VendorModel.findByIdAndUpdate(soldTo, {
          $inc: { amount: amountChange },
        });
      }

      // Recalculate running profit
      let effectiveSelling = 0;
      let profit = 0;
      const history =
        deviceUpdateData.sellHistory || oldDevice.sellHistory || [];
      for (const h of history) {
        if (h.type === "sell" && h.selling) {
          effectiveSelling += h.selling;
        } else if (h.type === "return" && h.returnAmount) {
          effectiveSelling -= h.returnAmount;
        }
        profit = effectiveSelling - (oldDevice.totalCost || 0);
      }
      deviceUpdateData.profit = profit;

      // Update the device
      const device = await this.deviceModel.findByIdAndUpdate(
        id,
        { ...deviceUpdateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );



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
    companyIds?: string,
    isActive?: boolean,
    search?: string,
    filter?: any
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };
      if (partnerId) query.partnerId = partnerId;
      if (companyIds) query.companyIds = companyIds;
      if (typeof isActive === "boolean") query.isActive = isActive;

      // Enhanced filtering
      if (filter) {
        if (filter.companyIds) query.companyIds = filter.companyIds;
        if (filter.pickedBy) query.pickedBy = filter.pickedBy;
        
        // Vendor filtering - filter devices that have transactions with specific vendor
        if (filter.vendorId) {
          query["sellHistory.vendor"] = new mongoose.Types.ObjectId(filter.vendorId);
        }
        
        // Date filtering
        if (filter.startDate || filter.endDate) {
          const dateQuery: any = {};
          if (filter.startDate) {
            dateQuery.$gte = new Date(filter.startDate);
          }
          if (filter.endDate) {
            const endDate = new Date(filter.endDate);
            endDate.setHours(23, 59, 59, 999);
            dateQuery.$lte = endDate;
          }
          query.date = dateQuery;
        }
        
        if (filter.deviceType === "new") {
          query.$or = [
            { sellHistory: { $exists: false } },
            { sellHistory: [] },
          ];
        }
        if (filter.deviceType === "sold") {
          query.$expr = {
            $and: [
              { $gt: [{ $size: { $ifNull: ["$sellHistory", []] } }, 0] },
              { $eq: [{ $arrayElemAt: ["$sellHistory.type", -1] }, "sell"] }
            ]
          };
        }
        if (filter.deviceType === "return") {
          query.$expr = {
            $and: [
              { $gt: [{ $size: { $ifNull: ["$sellHistory", []] } }, 0] },
              { $eq: [{ $arrayElemAt: ["$sellHistory.type", -1] }, "return"] }
            ]
          };
        }
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
          .populate("companyIds", "name")
          .populate("author.authorId", "name")
          .populate("pickedBy", "name")
          .populate("sellHistory.vendor", "name"),
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

      // Soft delete the device
      device.isDeleted = true;
      await device.save();

      return {
        message: "Device deleted successfully",
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
        sellHistory: { $exists: true, $ne: [] },
      };

      if (filters?.companyIds) query.companyIds = filters.companyIds;
      if (filters?.pickedBy) query.pickedBy = filters.pickedBy;
      if (filters?.vendorId) query["sellHistory.vendor"] = new mongoose.Types.ObjectId(filters.vendorId);
      
      // Date filtering
      if (filters?.startDate || filters?.endDate) {
        const dateQuery: any = {};
        if (filters.startDate) {
          dateQuery.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDate;
        }
        query.date = dateQuery;
      }

      const devices = await this.deviceModel
        .find(query)
        .populate("companyIds", "name")
        .populate("pickedBy", "name")
        .populate("sellHistory.vendor", "name")
        .sort({ createdAt: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      };

      const exportData = devices.map((device) => {
        const latestTransaction = device.sellHistory && device.sellHistory.length > 0 
          ? device.sellHistory[device.sellHistory.length - 1] 
          : null;
        
        return {
          "Device ID": device.deviceId,
          "Company": (device.companyIds as any)?.name || "N/A",
          "Company ID": device.selectedCompanyIds || "N/A",
          "Service Number": device.serviceNumber || "N/A",
          Brand: device.brand,
          Model: device.model,
          Box: device.box || "N/A",
          Warranty: device.warranty || "N/A",
          Issues: device.issues || "N/A",
          "IMEI 1": device.imei1,
          "IMEI 2": device.imei2 || "N/A",
          "Initial Cost": device.initialCost || 0,
          Cost: device.cost || 0,
          "Extra Amount": device.extraAmount || 0,
          Credits: device.credit || 0,
          "Per Credit Value": device.perCredit || 0,
          Commission: device.commission || 0,
          GST: device.gst || 0,
          "Total Cost": device.totalCost || 0,
          "Latest Vendor": latestTransaction?.vendor
            ? (latestTransaction.vendor as any)?.name
            : "N/A",
          "Latest Amount": latestTransaction?.type === "sell" 
            ? latestTransaction.selling || 0
            : latestTransaction?.returnAmount || 0,
          "Status": latestTransaction?.type || "New",
          Profit: device.profit || 0,
          "Picked By": (device.pickedBy as any)?.name || "N/A",
          "Picked Date": formatDate(device.date),
        };
      });

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
        $or: [{ sellHistory: { $exists: false } }, { sellHistory: [] }],
      };

      if (filters?.companyIds) query.companyIds = filters.companyIds;
      if (filters?.pickedBy) query.pickedBy = filters.pickedBy;
      
      // Date filtering
      if (filters?.startDate || filters?.endDate) {
        const dateQuery: any = {};
        if (filters.startDate) {
          dateQuery.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDate;
        }
        query.date = dateQuery;
      }

      const devices = await this.deviceModel
        .find(query)
        .populate("companyIds", "name")
        .populate("pickedBy", "name")
        .populate("sellHistory.vendor", "name")
        .sort({ createdAt: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      };

      const exportData = devices.map((device) => ({
        "Device ID": device.deviceId,
        "Company": (device.companyIds as any)?.name || "N/A",
        "Company ID": device.selectedCompanyIds || "N/A",
        "Service Number": device.serviceNumber || "N/A",
        Brand: device.brand,
        Model: device.model,
        Box: device.box || "N/A",
        Warranty: device.warranty || "N/A",
        Issues: device.issues || "N/A",
        "IMEI 1": device.imei1,
        "IMEI 2": device.imei2 || "N/A",
        "Initial Cost": device.initialCost || 0,
        "Purchased Cost": device.cost || 0,
        "Extra Amount": device.extraAmount || 0,
        Credits: device.credit || 0,
        "Per Credit Value": device.perCredit || 0,
        Commission: device.commission || 0,
        GST: device.gst || 0,
        "Total Cost": device.totalCost || 0,
        "Picked By": (device.pickedBy as any)?.name || "N/A",
        "Picked Date": formatDate(device.date),
        "Status": "New",
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

  async exportReturnDevices(
    partnerId: string,
    filters?: any
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = {
        isDeleted: false,
        partnerId,
        $expr: {
          $and: [
            { $gt: [{ $size: { $ifNull: ["$sellHistory", []] } }, 0] },
            { $eq: [{ $arrayElemAt: ["$sellHistory.type", -1] }, "return"] }
          ]
        }
      };

      if (filters?.companyIds) query.companyIds = filters.companyIds;
      if (filters?.pickedBy) query.pickedBy = filters.pickedBy;
      if (filters?.vendorId) query["sellHistory.vendor"] = new mongoose.Types.ObjectId(filters.vendorId);
      
      // Date filtering
      if (filters?.startDate || filters?.endDate) {
        const dateQuery: any = {};
        if (filters.startDate) {
          dateQuery.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDate;
        }
        query.date = dateQuery;
      }

      const devices = await this.deviceModel
        .find(query)
        .populate("companyIds", "name")
        .populate("pickedBy", "name")
        .populate("sellHistory.vendor", "name")
        .sort({ createdAt: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      };

      const exportData = devices.map((device) => {
        const latestTransaction = device.sellHistory && device.sellHistory.length > 0 
          ? device.sellHistory[device.sellHistory.length - 1] 
          : null;
        
        return {
          "Device ID": device.deviceId,
          "Company": (device.companyIds as any)?.name || "N/A",
          "Company ID": device.selectedCompanyIds || "N/A",
          "Service Number": device.serviceNumber || "N/A",
          Brand: device.brand,
          Model: device.model,
          Box: device.box || "N/A",
          Warranty: device.warranty || "N/A",
          Issues: device.issues || "N/A",
          "IMEI 1": device.imei1,
          "IMEI 2": device.imei2 || "N/A",
          "Initial Cost": device.initialCost || 0,
          "Purchased Cost": device.cost || 0,
          "Extra Amount": device.extraAmount || 0,
          Credits: device.credit || 0,
          "Per Credit Value": device.perCredit || 0,
          Commission: device.commission || 0,
          GST: device.gst || 0,
          "Total Cost": device.totalCost || 0,
          "Latest Vendor": latestTransaction?.vendor
            ? (latestTransaction.vendor as any)?.name
            : "N/A",
          "Latest Amount": latestTransaction?.type === "sell" 
            ? latestTransaction.selling || 0
            : latestTransaction?.returnAmount || 0,
          "Latest Date": formatDate(latestTransaction?.createdAt || ""),
          "Status": "Return",
          "Current Profit/Loss": device.profit || 0,
          "Picked By": (device.pickedBy as any)?.name || "N/A",
          "Picked Date": formatDate(device.date),
        };
      });

      return {
        data: exportData,
        message: "Return devices exported successfully",
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

  async exportEmployeeDevices(
    partnerId: string,
    pickedBy: string,
    filters?: any
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = {
        isDeleted: false,
        partnerId,
        pickedBy,
      };
      
      // Date filtering
      if (filters?.startDate || filters?.endDate) {
        const dateQuery: any = {};
        if (filters.startDate) {
          dateQuery.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDate;
        }
        query.date = dateQuery;
      }

      const devices = await this.deviceModel
        .find(query)
        .populate("companyIds", "name")
        .populate("pickedBy", "name")
        .populate("sellHistory.vendor", "name")
        .sort({ createdAt: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      };

      const exportData = devices.map((device) => {
        const latestTransaction = device.sellHistory && device.sellHistory.length > 0 
          ? device.sellHistory[device.sellHistory.length - 1] 
          : null;
        
        const status = latestTransaction ? latestTransaction.type : "New";
        
        return {
          "Device ID": device.deviceId,
          "Company": (device.companyIds as any)?.name || "N/A",
          "Company ID": device.selectedCompanyIds || "N/A",
          "Service Number": device.serviceNumber || "N/A",
          Brand: device.brand,
          Model: device.model,
          Box: device.box || "N/A",
          Warranty: device.warranty || "N/A",
          Issues: device.issues || "N/A",
          "IMEI 1": device.imei1,
          "IMEI 2": device.imei2 || "N/A",
          "Initial Cost": device.initialCost || 0,
          "Purchased Cost": device.cost || 0,
          "Extra Amount": device.extraAmount || 0,
          Credits: device.credit || 0,
          "Per Credit Value": device.perCredit || 0,
          Commission: device.commission || 0,
          GST: device.gst || 0,
          "Total Cost": device.totalCost || 0,
          "Latest Vendor": latestTransaction?.vendor
            ? (latestTransaction.vendor as any)?.name
            : "N/A",
          "Latest Amount": latestTransaction?.type === "sell" 
            ? latestTransaction.selling || 0
            : latestTransaction?.returnAmount || 0,
          "Status": status,
          "Current Profit/Loss": device.profit || 0,
          "Picked By": (device.pickedBy as any)?.name || "N/A",
          "Picked Date": formatDate(device.date),
        };
      });

      return {
        data: exportData,
        message: "Employee devices exported successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

}
