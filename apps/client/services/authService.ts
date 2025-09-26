import axiosInstance from "@/lib/axios";

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post("/partner/auth/login", {
    email,
    password,
  });
  return response?.data;
};

export const employeeLogin = async (email: string, password: string) => {
  const response = await axiosInstance.post("/partner/auth/employee-login", {
    email,
    password,
  });
  return response?.data;
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/partner/auth/me");
  return response?.data;
};

export const getPartnerProfile = async () => {
  const response = await axiosInstance.get("/partner/auth/profile");
  return response?.data;
};

export const getEmployeeProfile = async () => {
  const response = await axiosInstance.get("/partner/auth/employee-profile");
  return response?.data;
};
