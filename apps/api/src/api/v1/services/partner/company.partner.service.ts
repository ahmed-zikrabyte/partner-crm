import { CompanyModel, ICompany } from "../../../../models/company.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import { getEmptyFields } from "../../../../utils/text.utils";
import type { ServiceResponse } from "../../../../typings";

export default class CompanyService {
  private companyModel = CompanyModel;

  async create({
    partnerId,
    name,
    creditValue,
    companyIds,
  }: {
    partnerId: string;
    name: string;
    creditValue?: number;
    companyIds?: string[];
  }): Promise<ServiceResponse> {
    try {
      const emptyFields = getEmptyFields({ partnerId, name, companyIds });
      if (emptyFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${emptyFields}`,
          HTTP.BAD_REQUEST
        );
      }

      // 🔹 Check if company with the same name already exists for this partner
      const existingCompany = await this.companyModel.findOne({
        partnerId,
        name: { $regex: new RegExp(`^${name}$`, "i") }, // case-insensitive match
        isDeleted: false, // optionally ignore soft-deleted
      });

      if (existingCompany) {
        throw new AppError(
          `Company with this name already exists for this partner`,
          HTTP.CONFLICT
        );
      }

      const newCompany = await this.companyModel.create({
        partnerId,
        name,
        creditValue: creditValue,
        companyIds: companyIds,
      });

      await newCompany.save();

      return {
        message: "Company created successfully",
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
    updateData: Partial<ICompany>
  ): Promise<ServiceResponse> {
    try {
      // Optional: prevent duplicate name during update
      if (updateData.name) {
        const company = await this.companyModel.findById(id);
        if (!company) throw new AppError("Company not found", HTTP.NOT_FOUND);

        const duplicate = await this.companyModel.findOne({
          _id: { $ne: id }, // exclude current record
          partnerId: company.partnerId,
          name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
          isDeleted: false,
        });

        if (duplicate) {
          throw new AppError(
            `Company with this name already exists for this partner`,
            HTTP.CONFLICT
          );
        }
      }

      const updatedCompany = await this.companyModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedCompany)
        throw new AppError("Company not found", HTTP.NOT_FOUND);

      return {
        data: updatedCompany,
        message: "Company updated successfully",
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

      // if limit=0, fetch all without pagination
      const fetchQuery = this.companyModel.find(query).sort({ createdAt: -1 });
      if (limit !== 0) {
        fetchQuery.skip(skip).limit(limit);
      }

      const [companies, total] = await Promise.all([
        fetchQuery,
        this.companyModel.countDocuments(query),
      ]);

      const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);

      return {
        data: {
          companies,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit === 0 ? total : limit,
            hasNext: limit === 0 ? false : page < totalPages,
            hasPrev: limit === 0 ? false : page > 1,
          },
        },
        message: "Companies fetched successfully",
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
      const company = await this.companyModel.findById(id);
      if (!company) throw new AppError("Company not found", HTTP.NOT_FOUND);

      return {
        data: company,
        message: "Company fetched successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async softDelete(id: string): Promise<ServiceResponse> {
    try {
      const company = await this.companyModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );

      if (!company) throw new AppError("Company not found", HTTP.NOT_FOUND);

      return {
        message: "Company deleted successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async toggleIsActive(id: string): Promise<ServiceResponse> {
    try {
      const company = await this.companyModel.findById(id);
      if (!company) throw new AppError("Company not found", HTTP.NOT_FOUND);

      company.isActive = !company.isActive;
      await company.save();

      return {
        data: company,
        message: `Company is now ${company.isActive ? "active" : "inactive"}`,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
