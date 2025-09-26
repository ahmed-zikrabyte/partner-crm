import { VendorModel, IVendor } from "../../../../models/vendor.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";

export default class VendorService {
  private vendorModel = VendorModel;

  async create({
    partnerId,
    name,
    amount,
  }: {
    partnerId: string;
    name: string;
    amount?: number;
  }): Promise<ServiceResponse> {
    try {
      const emptyFields = getEmptyFields({ partnerId, name });
      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields}`,
          HTTP.BAD_REQUEST
        );
      }

      // Check if vendor with the same name already exists for this partner
      const existingVendor = await this.vendorModel.findOne({
        partnerId,
        name: { $regex: new RegExp(`^${name}$`, "i") }, // case-insensitive
        isDeleted: false,
      });

      if (existingVendor) {
        throw new AppError(
          `Vendor with this name already exists for this partner`,
          HTTP.CONFLICT
        );
      }

      const newVendor = await this.vendorModel.create({
        partnerId,
        name,
        amount: amount || 0,
      });

      await newVendor.save();

      return {
        message: "Vendor created successfully",
        status: HTTP.CREATED,
        success: true,
        data: newVendor,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, updateData: Partial<IVendor>): Promise<ServiceResponse> {
    try {
      if (updateData.name) {
        const vendor = await this.vendorModel.findById(id);
        if (!vendor) throw new AppError("Vendor not found", HTTP.NOT_FOUND);

        const duplicate = await this.vendorModel.findOne({
          _id: { $ne: id },
          partnerId: vendor.partnerId,
          name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
          isDeleted: false,
        });

        if (duplicate) {
          throw new AppError(
            `Vendor with this name already exists for this partner`,
            HTTP.CONFLICT
          );
        }
      }

      const updatedVendor = await this.vendorModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedVendor) throw new AppError("Vendor not found", HTTP.NOT_FOUND);

      return {
        data: updatedVendor,
        message: "Vendor updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(
    page: number = 1,
    limit: number = 10,
    partnerId?: string,
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };
      if (partnerId) query.partnerId = partnerId;
      if (typeof isActive === "boolean") query.isActive = isActive;
      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" };
      }

      const skip = (page - 1) * limit;
      const fetchQuery = this.vendorModel.find(query).sort({ createdAt: -1 });
      if (limit !== 0) fetchQuery.skip(skip).limit(limit);

      const [vendors, total] = await Promise.all([fetchQuery, this.vendorModel.countDocuments(query)]);
      const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);

      return {
        data: {
          vendors,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit === 0 ? total : limit,
            hasNext: limit === 0 ? false : page < totalPages,
            hasPrev: limit === 0 ? false : page > 1,
          },
        },
        message: "Vendors fetched successfully",
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
      const vendor = await this.vendorModel.findById(id);
      if (!vendor) throw new AppError("Vendor not found", HTTP.NOT_FOUND);

      return {
        data: vendor,
        message: "Vendor fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async softDelete(id: string): Promise<ServiceResponse> {
    try {
      const vendor = await this.vendorModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!vendor) throw new AppError("Vendor not found", HTTP.NOT_FOUND);

      return {
        message: "Vendor deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleIsActive(id: string): Promise<ServiceResponse> {
    try {
      const vendor = await this.vendorModel.findById(id);
      if (!vendor) throw new AppError("Vendor not found", HTTP.NOT_FOUND);

      vendor.isActive = !vendor.isActive;
      await vendor.save();

      return {
        data: vendor,
        message: `Vendor is now ${vendor.isActive ? "active" : "inactive"}`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
