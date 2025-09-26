import axiosInstance from "@/lib/axios";

export interface PartnerPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export const registerPartner = async (payload: PartnerPayload) => {
  try {
    const response = await axiosInstance.post(
      "/admin/partners/register",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error registering partner:", error);
    throw error;
  }
};

export const getAllPartners = async ({
  search,
  page,
  limit,
  isActive,
}: {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
} = {}) => {
  try {
    const response = await axiosInstance.get("/admin/partners", {
      params: { search, page, limit, isActive },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching partners:", error);
    throw error;
  }
};

export const getPartnerById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/admin/partners/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching partner ${id}:`, error);
    throw error;
  }
};

export const updatePartner = async (
  id: string,
  payload: Partial<PartnerPayload>
) => {
  try {
    const response = await axiosInstance.patch(`/admin/partners/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating partner ${id}:`, error);
    throw error;
  }
};

export const togglePartnerStatus = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/admin/partners/toggle/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling partner ${id} status:`, error);
    throw error;
  }
};

export const deletePartner = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/admin/partners/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting partner ${id}:`, error);
    throw error;
  }
};
