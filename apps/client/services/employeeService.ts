import axiosInstance from "@/lib/axios";

export interface EmployeePayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  salaryPerDay: number;
}

export interface EmployeeLoginPayload {
  email: string;
  password: string;
}

// ✅ Create employee
export const createEmployee = async (payload: EmployeePayload) => {
  try {
    const response = await axiosInstance.post("/partner/employees", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

// ✅ Get all employees
export const getAllEmployees = async ({
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
    const response = await axiosInstance.get("/partner/employees", {
      params: { search, page, limit, isActive },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// ✅ Get employee by ID
export const getEmployeeById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/partner/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching employee ${id}:`, error);
    throw error;
  }
};

// ✅ Update employee
export const updateEmployee = async (id: string, payload: Partial<EmployeePayload>) => {
  try {
    const response = await axiosInstance.patch(`/partner/employees/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error);
    throw error;
  }
};

// ✅ Toggle employee status
export const toggleEmployeeStatus = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/partner/employees/toggle/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling employee ${id} status:`, error);
    throw error;
  }
};

// ✅ Delete employee
export const deleteEmployee = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/partner/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error);
    throw error;
  }
};

// ✅ Employee login
export const employeeLogin = async (payload: EmployeeLoginPayload) => {
  try {
    const response = await axiosInstance.post("/partner/auth/employee-login", payload);
    return response.data;
  } catch (error) {
    console.error("Error in employee login:", error);
    throw error;
  }
};