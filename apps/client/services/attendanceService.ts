import axiosInstance from "@/lib/axios";

export interface AttendanceRecord {
  _id: string;
  partnerId: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  status: "Present" | "Absent";
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
}

export const attendanceService = {
  markAttendance: async (employeeId: string, date: string, status: "Present" | "Absent") => {
    const response = await axiosInstance.post("/partner/attendance/mark", {
      employeeId,
      date,
      status,
    });
    return response.data;
  },

  getEmployeeAttendance: async (employeeId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    const response = await axiosInstance.get(
      `/partner/attendance/employee/${employeeId}?${params.toString()}`
    );
    return response.data;
  },

  getAllEmployeesAttendance: async (date: string) => {
    const response = await axiosInstance.get(`/partner/attendance/all?date=${date}`);
    return response.data;
  },

  exportAttendance: async (startDate: string, endDate: string) => {
    const response = await axiosInstance.get(
      `/partner/attendance/export?startDate=${startDate}&endDate=${endDate}`,
      { responseType: 'blob' }
    );
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${startDate}-to-${endDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};