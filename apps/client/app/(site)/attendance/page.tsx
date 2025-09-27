"use client";

import { useState, useEffect, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { Calendar, CheckCircle, XCircle, Download, Users } from "lucide-react";
import NavBar from "@workspace/ui/components/nav-bar";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  attendanceService,
  AttendanceRecord,
  Employee,
} from "../../../services/attendanceService";
import { getAllEmployees } from "../../../services/employeeService";

interface AttendanceEmployee extends Employee {
  attendanceStatus?: "Present" | "Absent" | "Not Marked";
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
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

  const loadData = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const [employeesRes, attendanceRes] = await Promise.all([
        getAllEmployees({ page: pagination.currentPage, search }),
        attendanceService.getAllEmployeesAttendance(selectedDate),
      ]);

      const employeesWithAttendance = (employeesRes.data?.employees || []).map(
        (emp: Employee) => {
          const attendanceRecord = attendanceRes.data?.attendance?.find(
            (record: AttendanceRecord) => record.employeeId?._id === emp._id
          );
          return {
            ...emp,
            attendanceStatus: attendanceRecord?.status || "Not Marked",
          };
        }
      );

      setEmployees(employeesWithAttendance);
      setPagination(employeesRes.data?.pagination || pagination);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, pagination.currentPage, search]);

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
    status: "Present" | "Absent"
  ) => {
    if (!selectedDate) return;
    try {
      await attendanceService.markAttendance(employeeId, selectedDate, status);
      loadData();
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

  const presentCount = employees.filter(
    (emp) => emp.attendanceStatus === "Present"
  ).length;
  const absentCount = employees.filter(
    (emp) => emp.attendanceStatus === "Absent"
  ).length;

  const columns: ColumnDef<AttendanceEmployee>[] = [
    {
      accessorKey: "_id",
      header: "Sl.No",
      cell: ({ row }) => (pagination.currentPage - 1) * 10 + row.index + 1,
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "attendanceStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.attendanceStatus;
        return (
          <Badge
            variant={
              status === "Present"
                ? "default"
                : status === "Absent"
                  ? "destructive"
                  : "outline"
            }
            className="flex items-center gap-1 w-fit"
          >
            {status === "Present" && <CheckCircle className="h-3 w-3" />}
            {status === "Absent" && <XCircle className="h-3 w-3" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={
              row.original.attendanceStatus === "Present"
                ? "default"
                : "outline"
            }
            onClick={() => markAttendance(row.original._id!, "Present")}
            disabled={loading}
          >
            Present
          </Button>
          <Button
            size="sm"
            variant={
              row.original.attendanceStatus === "Absent"
                ? "destructive"
                : "outline"
            }
            onClick={() => markAttendance(row.original._id!, "Absent")}
            disabled={loading}
          >
            Absent
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            Track and manage employee attendance
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Present: {presentCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Absent: {absentCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Attendance
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-auto"
                />
                <Button onClick={loadData} disabled={loading} size="sm">
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="-mt-5">
            <NavBar
              label=""
              filtersComponent={
                <Input
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              }
            />
            <DataTable
              data={employees}
              columns={columns}
              pagination={pagination}
              onPaginationChange={handlePageChange}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min={exportStartDate}
              />
            </div>
            <Button
              onClick={handleExport}
              disabled={exportLoading || !exportStartDate || !exportEndDate}
              className="w-full"
            >
              {exportLoading ? "Exporting..." : "Export to Excel"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Export attendance data for the selected date range as an Excel
              file.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
