/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { EditIcon, Eye, Trash, Download } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import ConfirmationModal from "@/components/global/confirmation-modal";
import { DataTable } from "@workspace/ui/components/data-table";
import DeviceForm from "@/components/device/device.form";
import {
  getAllDevices,
  toggleDeviceStatus,
  deleteDevice,
  exportSoldDevices,
  exportNewDevices,
  exportReturnDevices,
  getEmployeesForPartner,
} from "@/services/deviceService";
import { getAllVendors } from "@/services/vendorService";
import { getAllCompanies } from "@/services/companyService";
import type { DeviceData } from "@/components/device/device.schema";
import { toast } from "sonner";

export default function DevicePage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  const [filters, setFilters] = useState({
    companyIds: "",
    pickedBy: "",
  });
  const [vendors, setVendors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openToggleModal, setOpenToggleModal] = useState(false);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    try {
      let filter: any = {};
      
      if (activeTab === "new") {
        filter.deviceType = "new";
      } else if (activeTab === "sold") {
        filter.deviceType = "sold";
      } else if (activeTab === "return") {
        filter.deviceType = "return";
      }

      // Add additional filters
      if (filters.companyIds) filter.companyIds = filters.companyIds;
      if (filters.pickedBy) filter.pickedBy = filters.pickedBy;

      const response = await getAllDevices({
        page: pagination.currentPage,
        search,
        filter,
      });
      setDevices(response.data.devices);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch devices");
    }
  }, [pagination.currentPage, search, activeTab, filters]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [vendorsRes, companiesRes, employeesRes] = await Promise.all([
        getAllVendors({ limit: 0 }),
        getAllCompanies({ limit: 0 }),
        getEmployeesForPartner(),
      ]);
      setVendors(vendorsRes.data.vendors || []);
      setCompanies(companiesRes.data.companies || []);
      setEmployees(employeesRes.data || []);
    } catch (err: any) {
      console.error("Error fetching filter options:", err);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchFilterOptions();
  }, [fetchDevices, fetchFilterOptions]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFilters({ companyIds: "", pickedBy: "" });
  };

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleExport = async () => {
    try {
      const exportFilters = {
        ...(filters.companyIds && { companyIds: filters.companyIds }),
        ...(filters.pickedBy && { pickedBy: filters.pickedBy }),
      };

      let response;
      if (activeTab === "new") {
        response = await exportNewDevices(exportFilters);
      } else if (activeTab === "sold") {
        response = await exportSoldDevices(exportFilters);
      } else if (activeTab === "return") {
        response = await exportReturnDevices(exportFilters);
      }

      // Create and download CSV
      const csvContent = convertToCSV(response.data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-devices-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${activeTab} devices exported successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to export devices");
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return "";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    return [headers, ...rows].join("\n");
  };

  const handleToggleSwitch = async () => {
    if (!selectedDevice) return;
    try {
      await toggleDeviceStatus(selectedDevice._id);
      toast.success(
        `Device ${selectedDevice.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchDevices();
      setOpenToggleModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;
    try {
      await deleteDevice(selectedDevice._id);
      toast.success("Device deleted successfully");
      fetchDevices();
      setOpenDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete device");
    }
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDevice(null);
    setModalMode(null);
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    fetchDevices();
    handleCloseModal();
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Create Device";
      case "edit":
        return "Edit Device";
      case "view":
        return "View Device";
      default:
        return "Device";
    }
  };

  const columns: ColumnDef<DeviceData>[] = [
    {
      accessorKey: "_id",
      header: "SL",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "deviceId",
      header: "Device ID",
    },
    {
      accessorKey: "selectedCompanyIds",
      header: "Company ID",
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
      accessorKey: "sellHistory",
      header: activeTab === "return" ? "Returned From" : "Sold To",
      cell: ({ row }) => {
        const sellHistory = row.original.sellHistory;
        if (activeTab === "return") {
          const lastReturn = sellHistory?.find(h => h.type === 'return');
          return lastReturn?.vendor?.name || "-";
        } else {
          const lastSell = sellHistory?.find(h => h.type === 'sell');
          return lastSell?.vendor?.name || "-";
        }
      },
    },
    {
      accessorKey: "companyIds",
      header: "Company",
      cell: ({ row }) => {
        const company = row.original.companyIds as any;
        return company?.name || company || "-";
      },
    },
    {
      accessorKey: "pickedBy",
      header: "Picked By",
      cell: ({ row }) => {
        const pickedBy = row.original.pickedBy as any;
        return pickedBy?.name || pickedBy || "-";
      },
    },
    ...(activeTab === "sold" ? [{
      accessorKey: "sellHistory",
      header: "Selling Amount",
      cell: ({ row }: { row: any }) => {
        const sellHistory = row.original.sellHistory;
        const lastSell = sellHistory?.find((h: any) => h.type === 'sell');
        return lastSell?.selling || lastSell?.amount || "-";
      },
    }, {
      accessorKey: "profit",
      header: "Profit/Loss",
      cell: ({ row }: { row: any }) => {
        const profit = row.original.profit;
        if (profit === undefined || profit === null) return "-";
        const isProfit = profit >= 0;
        return (
          <span className={isProfit ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {isProfit ? "+" : ""}{profit}
          </span>
        );
      },
    }] : []),
    ...(activeTab === "return" ? [{
      accessorKey: "sellHistory",
      header: "Return Amount",
      cell: ({ row }: { row: any }) => {
        const sellHistory = row.original.sellHistory;
        const lastReturn = sellHistory?.find((h: any) => h.type === 'return');
        return lastReturn?.returnAmount || lastReturn?.amount || "-";
      },
    }] : []),
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => router.push(`/device/${row.original._id}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setSelectedDevice(row.original);
              setModalMode("edit");
              setOpenModal(true);
            }}
          >
            <EditIcon className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => {
              setSelectedDevice(row.original);
              setOpenDeleteModal(true);
            }}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full bg-white shadow-md rounded-md px-4 md:px-6 py-3">
        <div className="flex flex-col gap-4">
          {/* First line: Title, Clear and Add Device buttons */}
          <div className="flex justify-between items-center">
            <div className="text-lg font-bold">Devices</div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedDevice(null);
                  setModalMode("create");
                  setOpenModal(true);
                }}
              >
                Add Device
              </Button>
            </div>
          </div>

          {/* Second line: Search, filters and export button */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex gap-3 items-center flex-wrap">
              <Input
                placeholder="Search by brand, model, or IMEI"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64"
              />

              <Select
                value={filters.companyIds || undefined}
                onValueChange={(value) =>
                  handleFilterChange("companyIds", value || "")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company: any) => (
                    <SelectItem key={company._id} value={company._id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.pickedBy || undefined}
                onValueChange={(value) =>
                  handleFilterChange("pickedBy", value || "")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export {activeTab === "new" ? "New" : activeTab === "sold" ? "Sold" : "Return"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="new">New Devices</TabsTrigger>
          <TabsTrigger value="sold">Sold Devices</TabsTrigger>
          <TabsTrigger value="return">Return Devices</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <DataTable
            data={devices}
            columns={columns}
            pagination={pagination}
            onPaginationChange={handlePageChange}
          />
        </TabsContent>
      </Tabs>

      {/* Device Modal for Create/Edit/View */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          {openModal && (
            <DeviceForm
              mode={modalMode!}
              deviceId={selectedDevice?._id}
              defaultValues={selectedDevice || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Modal */}
      {openToggleModal && selectedDevice && (
        <ConfirmationModal
          open={openToggleModal}
          onOpenChange={setOpenToggleModal}
          onConfirm={handleToggleSwitch}
          title="Toggle Device Status"
          description={`Are you sure you want to ${
            selectedDevice.isActive ? "deactivate" : "activate"
          } device "${selectedDevice.deviceId}"?`}
        />
      )}

      {/* Delete Modal */}
      {openDeleteModal && selectedDevice && (
        <ConfirmationModal
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          onConfirm={handleDelete}
          title="Delete Device"
          description={`Are you sure you want to delete device "${selectedDevice.deviceId}"?`}
        />
      )}
    </div>
  );
}
