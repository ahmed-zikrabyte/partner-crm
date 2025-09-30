import axiosInstance from "@/lib/axios";

export interface DevicePayload {
  partnerId: string;
  companyIds: string;
  date?: string;
  serviceNumber: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  initialCost: number;
  cost: number;
  extraAmount: number;
  credit: number; // number of credits used
  perCredit?: number; // will be fetched from company if needed
  commission?: number;
  gst?: number;
  totalCost?: number;
  selling?: number;
  profit?: number;
  pickedBy?: string;
  box?: string;
  warranty?: string;
  soldTo?: string;
  isActive?: boolean;
}

// ✅ Create device
export const createDevice = async (payload: DevicePayload) => {
  try {
    const response = await axiosInstance.post("/partner/devices", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating device:", error);
    throw error;
  }
};

// ✅ Get all devices (paginated or all)
export const getAllDevices = async ({
  search,
  page,
  limit,
  isActive,
  companyIds,
  pickedBy,
  deviceType,
  startDate,
  endDate,
  filter,
}: {
  search?: string;
  page?: number;
  limit?: number; // if limit = 0 → fetch all
  isActive?: boolean;
  companyIds?: string;
  pickedBy?: string;
  deviceType?: 'sold' | 'new' | 'return';
  startDate?: string;
  endDate?: string;
  filter?: any;
} = {}) => {
  try {
    const params: any = { search, page, limit, isActive, companyIds, pickedBy };
    
    // Build filter object
    const filterObj: any = { ...filter };
    if (deviceType) filterObj.deviceType = deviceType;
    if (pickedBy) filterObj.pickedBy = pickedBy;
    if (companyIds) filterObj.companyIds = companyIds;
    if (startDate) filterObj.startDate = startDate;
    if (endDate) filterObj.endDate = endDate;
    
    if (Object.keys(filterObj).length > 0) {
      params.filter = JSON.stringify(filterObj);
    }
    
    const response = await axiosInstance.get("/partner/devices", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
};

// ✅ Get device by ID
export const getDeviceById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/partner/devices/${id}`, {
      params: { populate: true }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching device ${id}:`, error);
    throw error;
  }
};

// ✅ Update device
export const updateDevice = async (
  id: string,
  payload: Partial<DevicePayload>
) => {
  try {
    const response = await axiosInstance.patch(`/partner/devices/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating device ${id}:`, error);
    throw error;
  }
};

// ✅ Toggle device status (isActive)
export const toggleDeviceStatus = async (id: string) => {
  try {
    const response = await axiosInstance.patch(`/partner/devices/toggle/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling device ${id} status:`, error);
    throw error;
  }
};

// ✅ Delete device
export const deleteDevice = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/partner/devices/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting device ${id}:`, error);
    throw error;
  }
};

// ✅ Get employees for partner
export const getEmployeesForPartner = async () => {
  try {
    const response = await axiosInstance.get("/partner/devices/employees/list");
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// ✅ Export sold devices
export const exportSoldDevices = async ({
  companyIds,
  pickedBy,
  startDate,
  endDate,
}: {
  companyIds?: string;
  pickedBy?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  try {
    const params: any = {};
    if (companyIds) params.companyIds = companyIds;
    if (pickedBy) params.pickedBy = pickedBy;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axiosInstance.get("/partner/devices/export/sold", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting sold devices:", error);
    throw error;
  }
};

// ✅ Export new devices
export const exportNewDevices = async ({
  companyIds,
  pickedBy,
  startDate,
  endDate,
}: {
  companyIds?: string;
  pickedBy?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  try {
    const params: any = {};
    if (companyIds) params.companyIds = companyIds;
    if (pickedBy) params.pickedBy = pickedBy;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axiosInstance.get("/partner/devices/export/new", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting new devices:", error);
    throw error;
  }
};

// ✅ Export return devices
export const exportReturnDevices = async ({
  companyIds,
  pickedBy,
  startDate,
  endDate,
}: {
  companyIds?: string;
  pickedBy?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  try {
    const params: any = {};
    if (companyIds) params.companyIds = companyIds;
    if (pickedBy) params.pickedBy = pickedBy;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axiosInstance.get("/partner/devices/export/return", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting return devices:", error);
    throw error;
  }
};
