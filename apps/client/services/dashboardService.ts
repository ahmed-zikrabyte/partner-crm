import axiosInstance from "@/lib/axios";

export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get("/partner/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};