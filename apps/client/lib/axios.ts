// Only for client-side usage
import axios from "axios";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}`,
});

// Add request interceptor to include token from localStorage (client-only)
if (typeof window !== "undefined") {
  console.log("url", process.env.NEXT_PUBLIC_SERVER_URL); // Debug
  axiosInstance.interceptors.request.use(
    (config) => {
      const userType = localStorage.getItem("userType");
      const token = userType === "employee" 
        ? localStorage.getItem("employeeToken")
        : localStorage.getItem("partnerToken");
      console.log("📦 Sending token:", token); // Debug

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Add response interceptor to handle global errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.log("📦 Received status:", data); // Debug

      if (status === 401 && (data.error === "INVALID_TOKEN" || data.error === "TOKEN_EXPIRED")) {
        console.warn("Unauthorized access - Token may be expired.");
        localStorage.removeItem("partnerToken");
        localStorage.removeItem("employeeToken");
        localStorage.removeItem("userType");
        window.location.href = "/login";
      }

      if (status === 403) {
        console.warn("Access Denied - Admin lacks permissions.");
      }

      if (status >= 500) {
        console.error(
          "Server Error:",
          error.response.data.message || "Unexpected error"
        );
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
