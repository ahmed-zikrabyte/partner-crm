/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Minus,
} from "lucide-react";
import NavBar from "@workspace/ui/components/nav-bar";
import {
  attendanceService,
  AttendanceRecord,
  Employee,
} from "../../../services/attendanceService";
import { getAllEmployees } from "../../../services/employeeService";

interface AttendanceEmployee extends Employee {
  attendanceData: Record<string, "Present" | "Absent" | "Not Marked">;
  totalWorkingDays: number;
}

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [employees, setEmployees] = useState<AttendanceEmployee[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Generate dates for the selected month
  const getDatesInMonth = (monthString: string) => {
    const year = parseInt(monthString.split("-")[0] || "0");
    const month = parseInt(monthString.split("-")[1] || "0") - 1;
    const datesInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: datesInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return date.toISOString().split("T")[0];
    });
  };

  const monthDates = getDatesInMonth(selectedMonth);
  const totalDaysInMonth = monthDates.length;

  const loadData = useCallback(async () => {
    if (!selectedMonth) return;
    setLoading(true);
    try {
      const employeesRes = await getAllEmployees({
        page: pagination.currentPage,
        search,
      });

      const startDate = `${selectedMonth}-01`;
      const year = parseInt(selectedMonth.split("-")[0] || "0");
      const month = parseInt(selectedMonth.split("-")[1] || "0") - 1;
      const endDate =
        new Date(year, month + 1, 0).toISOString().split("T")[0] || "";

      // Get bulk attendance data for all employees and all dates in the month
      const bulkAttendanceRes = await attendanceService.getBulkAttendance(
        startDate,
        endDate
      );
      const allAttendanceRecords = bulkAttendanceRes?.data || [];

      console.log("Bulk attendance data:", allAttendanceRecords);

      // Process employees with their attendance data
      const employeesWithAttendance = (employeesRes.data?.employees || []).map(
        (emp: Employee) => {
          const attendanceData: Record<
            string,
            "Present" | "Absent" | "Not Marked"
          > = {};
          let totalWorkingDays = 0;

          monthDates.forEach((date) => {
            if (!date) return;
            const record = allAttendanceRecords.find(
              (record: AttendanceRecord) => {
                const recordDate = record.date.split("T")[0];
                const employeeId =
                  typeof record.employeeId === "object"
                    ? record.employeeId?._id
                    : record.employeeId;
                return (
                  recordDate === date && employeeId && employeeId === emp._id
                );
              }
            );
            const status = record?.status || "Not Marked";
            attendanceData[date] = status;
            if (status === "Present") totalWorkingDays++;
          });

          return {
            ...emp,
            attendanceData,
            totalWorkingDays,
          };
        }
      );

      setEmployees(employeesWithAttendance);
      setPagination(
        employeesRes.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      );
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, pagination.currentPage, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const markAttendance = async (
    employeeId: string,
    date: string,
    status: "Present" | "Absent"
  ) => {
    try {
      await attendanceService.markAttendance(employeeId, date, status);
      // Update local state immediately for better UX
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp._id === employeeId) {
            const newAttendanceData = { ...emp.attendanceData };
            const oldStatus = newAttendanceData[date];
            newAttendanceData[date] = status;

            let totalWorkingDays = emp.totalWorkingDays;
            if (oldStatus === "Present" && status !== "Present") {
              totalWorkingDays--;
            } else if (oldStatus !== "Present" && status === "Present") {
              totalWorkingDays++;
            }

            return {
              ...emp,
              attendanceData: newAttendanceData,
              totalWorkingDays,
            };
          }
          return emp;
        })
      );
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert("Please select both start and end dates for export");
      return;
    }

    setExportLoading(true);
    try {
      await attendanceService.exportAttendance(exportStartDate, exportEndDate);
    } catch (error) {
      console.error("Error exporting attendance:", error);
      alert("Failed to export attendance data");
    } finally {
      setExportLoading(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const parts = selectedMonth.split("-");
    const year = parseInt(parts[0] || "0");
    const month = parseInt(parts[1] || "0");
    let newYear = year;
    let newMonth = month;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }

    const newDate = `${newYear}-${newMonth.toString().padStart(2, "0")}`;
    setSelectedMonth(newDate);
  };

  const getStatusIcon = (status: "Present" | "Absent" | "Not Marked") => {
    switch (status) {
      case "Present":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: "Present" | "Absent" | "Not Marked") => {
    switch (status) {
      case "Present":
        return "bg-green-100 hover:bg-green-200 border-green-300";
      case "Absent":
        return "bg-red-100 hover:bg-red-200 border-red-300";
      default:
        return "bg-gray-50 hover:bg-gray-100 border-gray-200";
    }
  };

  const totalPresent = employees.reduce(
    (sum, emp) => sum + emp.totalWorkingDays,
    0
  );
  const totalAbsent = employees.reduce((sum, emp) => {
    const absentDays = Object.values(emp.attendanceData).filter(
      (status) => status === "Absent"
    ).length;
    return sum + absentDays;
  }, 0);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Register</h1>
          <p className="text-muted-foreground">
            Monthly attendance tracking -{" "}
            {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
                className="w-auto"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={loadData} disabled={loading} size="sm">
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-48"
              />
              <Input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-auto"
              />
              <Input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min={exportStartDate}
                className="w-auto"
              />
              <Button
                onClick={handleExport}
                disabled={exportLoading || !exportStartDate || !exportEndDate}
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                {exportLoading ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium sticky left-0 bg-muted z-10 min-w-[200px] border-r">
                      Employee
                    </th>
                    {monthDates.map((date) => {
                      if (!date) return null;
                      const day = new Date(date).getDate();
                      const dayName = new Date(date).toLocaleDateString(
                        "en-US",
                        { weekday: "short" }
                      );
                      return (
                        <th
                          key={date}
                          className="text-center p-2 font-medium min-w-[60px] border-r"
                        >
                          <div className="text-xs text-muted-foreground">
                            {dayName}
                          </div>
                          <div>{day}</div>
                        </th>
                      );
                    })}
                    <th className="text-center p-3 font-medium min-w-[100px] bg-blue-50">
                      Working Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <tr
                      key={employee._id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-3 sticky left-0 bg-background z-10 border-r">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {(pagination.currentPage - 1) * 10 + index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {employee.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      {monthDates.map((date) => {
                        if (!date) return null;
                        const status =
                          employee.attendanceData?.[date] || "Not Marked";
                        const isToday =
                          date === new Date().toISOString().split("T")[0];
                        const isFutureDate = new Date(date) > new Date();

                        // Debug log
                        if (index === 0) {
                          console.log(
                            `Rendering date ${date} for ${employee.name}: status = ${status}`
                          );
                        }

                        return (
                          <td
                            key={`${employee._id}-${date}`}
                            className="p-1 border-r"
                          >
                            <div className="flex flex-col gap-1">
                              <button
                                className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors ${getStatusColor(status)} ${isToday ? "ring-2 ring-blue-500" : ""}`}
                                onClick={() =>
                                  !isFutureDate &&
                                  markAttendance(
                                    employee._id!,
                                    date,
                                    status === "Present" ? "Absent" : "Present"
                                  )
                                }
                                disabled={loading || isFutureDate}
                                title={
                                  isFutureDate
                                    ? "Future date"
                                    : `Click to mark ${status === "Present" ? "Absent" : "Present"}`
                                }
                              >
                                {getStatusIcon(status)}
                              </button>
                              <div className="flex gap-1">
                                <button
                                  className="w-4 h-4 bg-green-500 hover:bg-green-600 rounded text-white text-xs flex items-center justify-center"
                                  onClick={() =>
                                    !isFutureDate &&
                                    markAttendance(
                                      employee._id!,
                                      date,
                                      "Present"
                                    )
                                  }
                                  disabled={loading || isFutureDate}
                                  title="Mark Present"
                                >
                                  ✓
                                </button>
                                <button
                                  className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded text-white text-xs flex items-center justify-center"
                                  onClick={() =>
                                    !isFutureDate &&
                                    markAttendance(
                                      employee._id!,
                                      date,
                                      "Absent"
                                    )
                                  }
                                  disabled={loading || isFutureDate}
                                  title="Mark Absent"
                                >
                                  ✗
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3 text-center bg-blue-50 font-medium">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          {employee.totalWorkingDays} / {totalDaysInMonth}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
