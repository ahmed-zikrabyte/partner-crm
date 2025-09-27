import axiosInstance from "@/lib/axios";

export interface CompanyPayload {
  name: string;
  creditValue?: number;
  companyIds?: string[];
}

// ✅ Create company
export const createCompany = async (payload: CompanyPayload) => {
  try {
    const response = await axiosInstance.post("/partner/companies", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

// ✅ Get all companies (paginated or all)
export const getAllCompanies = async ({
  search,
  page,
  limit,
  isActive,
}: {
  search?: string;
  page?: number;
  limit?: number; // if limit = 0 → fetch all
  isActive?: boolean;
} = {}) => {
  try {
    const response = await axiosInstance.get("/partner/companies", {
      params: { search, page, limit, isActive },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

// ✅ Get company by ID
export const getCompanyById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/partner/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching company ${id}:`, error);
    throw error;
  }
};

// ✅ Update company
export const updateCompany = async (
  id: string,
  payload: Partial<CompanyPayload>
) => {
  try {
    const response = await axiosInstance.patch(`/partner/companies/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating company ${id}:`, error);
    throw error;
  }
};

// ✅ Toggle company status (isActive)
export const toggleCompanyStatus = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/partner/companies/toggle/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling company ${id} status:`, error);
    throw error;
  }
};

// ✅ Delete company
export const deleteCompany = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/partner/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting company ${id}:`, error);
    throw error;
  }
};
