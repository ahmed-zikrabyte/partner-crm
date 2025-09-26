import axiosInstance from "@/lib/axios";

export interface VendorPayload {
  name: string;
  amount?: number;
}

// ✅ Create vendor
export const createVendor = async (payload: VendorPayload) => {
  try {
    const response = await axiosInstance.post("/partner/vendors", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating vendor:", error);
    throw error;
  }
};

// ✅ Get all vendors (paginated or all)
export const getAllVendors = async ({
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
    const response = await axiosInstance.get("/partner/vendors", {
      params: { search, page, limit, isActive },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw error;
  }
};

// ✅ Get vendor by ID
export const getVendorById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/partner/vendors/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching vendor ${id}:`, error);
    throw error;
  }
};

// ✅ Update vendor
export const updateVendor = async (id: string, payload: Partial<VendorPayload>) => {
  try {
    const response = await axiosInstance.patch(`/partner/vendors/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating vendor ${id}:`, error);
    throw error;
  }
};

// ✅ Toggle vendor status (isActive)
export const toggleVendorStatus = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/partner/vendors/toggle/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling vendor ${id} status:`, error);
    throw error;
  }
};

// ✅ Delete vendor
export const deleteVendor = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/partner/vendors/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting vendor ${id}:`, error);
    throw error;
  }
};
