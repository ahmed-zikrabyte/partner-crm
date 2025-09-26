import axiosInstance from "@/lib/axios";

export const getPartnerProfile = async () => {
  const response = await axiosInstance.get("/partner/profile");
  return response.data;
};