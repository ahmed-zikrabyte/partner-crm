/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { EditIcon, Eye, Trash } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import NavBar from "@workspace/ui/components/nav-bar";
import ConfirmationModal from "@/components/global/confirmation-modal";
import { DataTable } from "@workspace/ui/components/data-table";
import DeviceForm from "@/components/device/device.form";
import {
  getAllDevices,
  toggleDeviceStatus,
  deleteDevice,
} from "@/services/deviceService";
import type { DeviceData } from "@/components/device/device.schema";
import { toast } from "sonner";

export default function DevicePage() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");

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
      const response = await getAllDevices({
        page: pagination.currentPage,
        search,
      });
      setDevices(response.data.devices);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch devices");
    }
  }, [pagination.currentPage, search]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
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
      accessorKey: "vendorId",
      header: "Vendor",
      cell: ({ row }) => {
        const vendor = row.original.vendorId as any;
        return vendor?.name || vendor || "-";
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
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={() => {
            setSelectedDevice(row.original);
            setOpenToggleModal(true);
          }}
        />
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setSelectedDevice(row.original);
              setModalMode("view");
              setOpenModal(true);
            }}
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
      <NavBar
        label="Devices"
        filtersComponent={
          <Input
            placeholder="Search by brand, model, or IMEI"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        }
        button={
          <Button
            variant="default"
            onClick={() => {
              setSelectedDevice(null);
              setModalMode("create");
              setOpenModal(true);
            }}
          >
            Add Device
          </Button>
        }
      />

      <DataTable
        data={devices}
        columns={columns}
        pagination={pagination}
        onPaginationChange={handlePageChange}
      />

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
