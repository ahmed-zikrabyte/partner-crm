/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { EditIcon, Eye, Trash, Download, X } from "lucide-react";
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
import ConfirmationModal from "@/components/global/confirmation-modal";
import { DataTable } from "@workspace/ui/components/data-table";
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
  const [loading, setLoading] = useState(false);
  
  // Separate state for better control
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  
  const [pagination, setPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const [filters, setFilters] = useState({
    companyIds: "",
    pickedBy: "",
    vendorId: "",
    startDate: "",
    endDate: "",
  });
  
  const [searchStates, setSearchStates] = useState({
    vendor: "",
    company: "",
    employee: "",
  });
  
  const [vendors, setVendors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openToggleModal, setOpenToggleModal] = useState(false);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch filter options once on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
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
    };

    fetchFilterOptions();
  }, []);

  // Fetch devices - simplified dependencies
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        let filter: any = {};
        
        // If there's a search term, search across all device types
        if (debouncedSearch.trim()) {
          // Don't filter by deviceType when searching
        } else {
          // Only apply tab filter when not searching
          if (activeTab === "new") {
            filter.deviceType = "new";
          } else if (activeTab === "sold") {
            filter.deviceType = "sold";
          } else if (activeTab === "return") {
            filter.deviceType = "return";
          }
        }

        // Add additional filters
        if (filters.companyIds) filter.companyIds = filters.companyIds;
        if (filters.pickedBy) filter.pickedBy = filters.pickedBy;
        if (filters.vendorId) filter.vendorId = filters.vendorId;
        if (filters.startDate) filter.startDate = filters.startDate;
        if (filters.endDate) filter.endDate = filters.endDate;

        const response = await getAllDevices({
          page: currentPage,
          search: debouncedSearch,
          filter,
        });
        
        setDevices(response.data.devices);
        setPagination({
          totalPages: response.data.pagination.totalPages,
          hasNext: response.data.pagination.hasNext,
          hasPrev: response.data.pagination.hasPrev,
        });
        
        // If searching and devices found, auto-switch to appropriate tab
        if (debouncedSearch.trim() && response.data.devices.length > 0) {
          const firstDevice = response.data.devices[0];
          const deviceType = getDeviceType(firstDevice);
          if (deviceType && deviceType !== activeTab) {
            setActiveTab(deviceType);
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Failed to fetch devices");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [currentPage, debouncedSearch, activeTab, filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  // Helper function to determine device type
  const getDeviceType = (device: any) => {
    if (device.sellHistory && device.sellHistory.length > 0) {
      const lastEntry = device.sellHistory[device.sellHistory.length - 1];
      if (lastEntry.type === 'return') return 'return';
      if (lastEntry.type === 'sell') return 'sold';
    }
    return 'new';
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setFilters({ companyIds: "", pickedBy: "", vendorId: "", startDate: "", endDate: "" });
    setSearchStates({ vendor: "", company: "", employee: "" });
  };

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({ companyIds: "", pickedBy: "", vendorId: "", startDate: "", endDate: "" });
    setSearchStates({ vendor: "", company: "", employee: "" });
    setSearch("");
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return search || filters.companyIds || filters.pickedBy || filters.vendorId || filters.startDate || filters.endDate;
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      let filter: any = {};
      
      if (debouncedSearch.trim()) {
        // Don't filter by deviceType when searching
      } else {
        if (activeTab === "new") {
          filter.deviceType = "new";
        } else if (activeTab === "sold") {
          filter.deviceType = "sold";
        } else if (activeTab === "return") {
          filter.deviceType = "return";
        }
      }

      if (filters.companyIds) filter.companyIds = filters.companyIds;
      if (filters.pickedBy) filter.pickedBy = filters.pickedBy;
      if (filters.vendorId) filter.vendorId = filters.vendorId;
      if (filters.startDate) filter.startDate = filters.startDate;
      if (filters.endDate) filter.endDate = filters.endDate;

      const response = await getAllDevices({
        page: currentPage,
        search: debouncedSearch,
        filter,
      });
      
      setDevices(response.data.devices);
      setPagination({
        totalPages: response.data.pagination.totalPages,
        hasNext: response.data.pagination.hasNext,
        hasPrev: response.data.pagination.hasPrev,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportFilters = {
        ...(filters.companyIds && { companyIds: filters.companyIds }),
        ...(filters.pickedBy && { pickedBy: filters.pickedBy }),
        ...(filters.vendorId && { vendorId: filters.vendorId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
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
      await refreshData();
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
      await refreshData();
      setOpenDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete device");
    }
  };

  const columns: ColumnDef<DeviceData>[] = [
    {
      accessorKey: "_id",
      header: "SL",
      cell: ({ row }) => (currentPage - 1) * 10 + row.index + 1,
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
      accessorKey: "sellHistory",
      header: "Return Count",
      cell: ({ row }) => {
        const sellHistory = row.original.sellHistory;
        const returnCount = sellHistory?.filter((h: any) => h.type === 'return').length || 0;
        return (
          <span className={returnCount > 3 ? "text-red-600 font-bold" : "text-gray-900"}>
            {returnCount}
          </span>
        );
      },
    },
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
            onClick={() => router.push(`/device/edit/${row.original._id}`)}
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
              {hasActiveFilters() && (
                <Button variant="outline" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
              <Button onClick={() => router.push("/device/create")}>
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
                  <div className="p-2">
                    <Input
                      placeholder="Search companies..."
                      value={searchStates.company}
                      onChange={(e) => setSearchStates(prev => ({ ...prev, company: e.target.value }))}
                      className="mb-2"
                    />
                  </div>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies
                    .filter((company: any) => 
                      company.name.toLowerCase().includes(searchStates.company.toLowerCase())
                    )
                    .map((company: any) => (
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
                  <div className="p-2">
                    <Input
                      placeholder="Search employees..."
                      value={searchStates.employee}
                      onChange={(e) => setSearchStates(prev => ({ ...prev, employee: e.target.value }))}
                      className="mb-2"
                    />
                  </div>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees
                    .filter((employee: any) => 
                      employee.name.toLowerCase().includes(searchStates.employee.toLowerCase())
                    )
                    .map((employee: any) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.vendorId || undefined}
                onValueChange={(value) =>
                  handleFilterChange("vendorId", value || "")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search vendors..."
                      value={searchStates.vendor}
                      onChange={(e) => setSearchStates(prev => ({ ...prev, vendor: e.target.value }))}
                      className="mb-2"
                    />
                  </div>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors
                    .filter((vendor: any) => 
                      vendor.name.toLowerCase().includes(searchStates.vendor.toLowerCase())
                    )
                    .map((vendor: any) => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-40"
              />
              
              <Input
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-40"
              />
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
            pagination={{
              currentPage,
              ...pagination,
            }}
            onPaginationChange={handlePageChange}
            loading={loading}
            getRowClassName={(device: DeviceData) => {
              const returnCount = device.sellHistory?.filter((h: any) => h.type === 'return').length || 0;
              return returnCount > 3 ? "bg-red-50 border-red-200" : "";
            }}
          />
        </TabsContent>
      </Tabs>

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