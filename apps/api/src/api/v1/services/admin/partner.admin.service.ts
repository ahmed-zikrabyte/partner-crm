import bcryptjs from "bcryptjs";
import { PartnerModel, IPartner } from "../../../../models/partner.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";

export default class PartnerAuthService {
  private partnerModel = PartnerModel;

  async register({
    name,
    email,
    phone,
    password,
  }: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<ServiceResponse> {
    try {
      // Check required fields
      const emptyFields = getEmptyFields({ name, email, password });
      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields}`,
          HTTP.BAD_REQUEST
        );
      }

      // Check if partner exists
      const existingPartner = await this.partnerModel.findOne({ email });
      if (existingPartner) {
        throw new AppError("Partner already exists", HTTP.CONFLICT);
      }

      const hashedPassword = bcryptjs.hashSync(password, 10);

      const newPartner = await this.partnerModel.create({
        name,
        email,
        phone,
        password: hashedPassword,
      });

      await newPartner.save();

      return {
        message: "Partner registered successfully",
        status: HTTP.CREATED,
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
    isActive?: boolean,
    search?: string
  ): Promise<ServiceResponse> {
    try {
      const query: Record<string, any> = { isDeleted: false };

      // Filter by active status
      if (typeof isActive === "boolean") {
        query.isActive = isActive;
      }

      // Search by name or email
      if (search && search.trim() !== "") {
        query.$or = [
          { name: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ];
      }

      const skip = (page - 1) * limit;

      const [partners, total] = await Promise.all([
        this.partnerModel
          .find(query)
          .select("-password") // exclude sensitive fields
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.partnerModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: {
          partners,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: "Partners fetched successfully",
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
      const partner = await this.partnerModel.findById(id).select("-password");
      if (!partner) throw new AppError("Partner not found", HTTP.NOT_FOUND);
      return {
        data: partner,
        message: "Partner fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async update(
    id: string,
    updateData: Partial<IPartner>
  ): Promise<ServiceResponse> {
    try {
      if (updateData.password) {
        updateData.password = bcryptjs.hashSync(updateData.password, 10);
      }

      const updatedPartner = await this.partnerModel
        .findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        })
        .select("-password");

      if (!updatedPartner)
        throw new AppError("Partner not found", HTTP.NOT_FOUND);

      return {
        data: updatedPartner,
        message: "Partner updated successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async softDelete(id: string): Promise<ServiceResponse> {
    try {
      const partner = await this.partnerModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!partner) throw new AppError("Partner not found", HTTP.NOT_FOUND);

      return {
        message: "Partner deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleIsActive(id: string): Promise<ServiceResponse> {
    try {
      const partner = await this.partnerModel.findById(id);
      if (!partner) throw new AppError("Partner not found", HTTP.NOT_FOUND);

      partner.isActive = !partner.isActive;
      await partner.save();

      return {
        data: partner,
        message: `Partner is now ${partner.isActive ? "active" : "inactive"}`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
