import axiosInstance from "@/lib/axios";

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post("/admin/auth/login", {
    email,
    password,
  });
  return response?.data;
};
