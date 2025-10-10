/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, Download } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { getEmployeeById } from "@/services/employeeService";
import { getAllDevices, exportEmployeeDevices } from "@/services/deviceService";
import { toast } from "sonner";
import { format } from "date-fns";

interface DeviceData {
  _id: string;
  deviceId: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  selling: number;
  profit: number;
  isActive: boolean;
  pickedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  salaryPerDay: number;
  isActive: boolean;
}

export default function EmployeeDevicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false,
  });

  const fetchEmployeeDevices = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const resolvedParams = await params;

      const [employeeRes, devicesRes] = await Promise.all([
        getEmployeeById(resolvedParams.id),
        getAllDevices({ 
          page, 
          limit: 10, 
          pickedBy: resolvedParams.id,
          search: searchTerm || undefined
        }),
      ]);

      setEmployee(employeeRes.data);
      setDevices(devicesRes.data.devices || []);
      setPagination(devicesRes.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch employee devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDevices(currentPage, search);
  }, [params, currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchEmployeeDevices(1, search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handlePaginationChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleExport = async () => {
    if (!employee) {
      toast.error("Employee data not available");
      return;
    }

    try {
      const response = await exportEmployeeDevices({
        pickedBy: employee._id,
      });

      const exportData = response.data || [];

      if (exportData.length === 0) {
        toast.error("No devices to export");
        return;
      }

      // Convert JSON to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row: any) =>
          headers
            .map((header) =>
              typeof row[header] === "string" && row[header].includes(",")
                ? `"${row[header]}"`
                : row[header]
            )
            .join(",")
        ),
      ].join("\n");

      // Create and download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${employee.name}-devices-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Devices exported successfully");
    } catch (error) {
      console.error("Error exporting devices:", error);
      toast.error("Failed to export devices");
    }
  };

  const deviceColumns: ColumnDef<DeviceData>[] = [
    {
      accessorKey: "deviceId",
      header: "Device ID",
    },
    {
      accessorKey: "brand",
      header: "Brand",
    },
    {
      accessorKey: "model",
      header: "Model",
    },
    {
      accessorKey: "imei1",
      header: "IMEI1",
    },
    {
      accessorKey: "selling",
      header: "Selling Price",
      cell: ({ row }) => {
        const device = row.original as any;
        const sellHistory =
          device.sellHistory?.filter((h: any) => h.type === "sell") || [];
        const latestSell = sellHistory.sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.date).getTime() -
            new Date(a.createdAt || a.date).getTime()
        )[0];
        const sellingPrice =
          latestSell?.selling || latestSell?.amount || device.selling;
        return sellingPrice ? `₹${sellingPrice}` : "-";
      },
    },
    {
      accessorKey: "profit",
      header: "Profit",
      cell: ({ row }) => row.original.profit ? `₹${row.original.profit}` : "-",
    },
    {
      accessorKey: "createdAt",
      header: "Picked Date",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  if (!employee) {
    return (
      <div className="flex justify-center items-center h-64">
        Employee not found
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Employee Devices</h1>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Devices Picked by {employee.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Employee Name
              </label>
              <p className="text-lg font-semibold">{employee.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg font-semibold">{employee.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-lg font-semibold">{employee.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Salary Per Day</label>
              <p className="text-lg font-semibold">{employee.salaryPerDay}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Total Devices
              </label>
              <p className="text-lg font-semibold">{pagination.totalItems}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search devices by ID, brand, model, or IMEI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={deviceColumns}
            data={devices}
            loading={loading}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
