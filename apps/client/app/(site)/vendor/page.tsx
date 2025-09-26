/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import VendorForm from "@/components/vendor/vendor.form";
import {
  getAllVendors,
  toggleVendorStatus,
  deleteVendor,
} from "@/services/vendorService";
import type { VendorData } from "@/components/vendor/vendor.schema";
import { toast } from "sonner";

export default function VendorPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");

  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openToggleModal, setOpenToggleModal] = useState(false);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    try {
      const response = await getAllVendors({
        page: pagination.currentPage,
        search,
      });
      setVendors(response.data.vendors);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch vendors");
    }
  }, [pagination.currentPage, search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleToggleSwitch = async () => {
    if (!selectedVendor) return;
    try {
      await toggleVendorStatus(selectedVendor._id);
      toast.success(
        `Vendor ${selectedVendor.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchVendors();
      setOpenToggleModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!selectedVendor) return;
    try {
      await deleteVendor(selectedVendor._id);
      toast.success("Vendor deleted successfully");
      fetchVendors();
      setOpenDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete vendor");
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedVendor(null);
    setModalMode(null);
  };

  const handleFormSuccess = () => {
    fetchVendors();
    handleCloseModal();
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Create Vendor";
      case "edit":
        return "Edit Vendor";
      case "view":
        return "View Vendor";
      default:
        return "Vendor";
    }
  };

  const columns: ColumnDef<VendorData>[] = [
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
      accessorKey: "amount",
      header: "Amount",
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={() => {
            setSelectedVendor(row.original);
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
              router.push(`/vendor/${row.original._id}`);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setSelectedVendor(row.original);
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
              setSelectedVendor(row.original);
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
        label="Vendors"
        filtersComponent={
          <Input
            placeholder="Search by name"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        }
        button={
          <Button
            variant="default"
            onClick={() => {
              setSelectedVendor(null);
              setModalMode("create");
              setOpenModal(true);
            }}
          >
            Add Vendor
          </Button>
        }
      />

      <DataTable
        data={vendors}
        columns={columns}
        pagination={pagination}
        onPaginationChange={handlePageChange}
      />

      {/* Vendor Modal */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          {openModal && (
            <VendorForm
              mode={modalMode!}
              vendorId={selectedVendor?._id}
              defaultValues={selectedVendor || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Modal */}
      {openToggleModal && selectedVendor && (
        <ConfirmationModal
          open={openToggleModal}
          onOpenChange={setOpenToggleModal}
          onConfirm={handleToggleSwitch}
          title="Toggle Vendor Status"
          description={`Are you sure you want to ${
            selectedVendor.isActive ? "deactivate" : "activate"
          } "${selectedVendor.name}"?`}
        />
      )}

      {/* Delete Modal */}
      {openDeleteModal && selectedVendor && (
        <ConfirmationModal
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          onConfirm={handleDelete}
          title="Delete Vendor"
          description={`Are you sure you want to delete "${selectedVendor.name}"?`}
        />
      )}
    </div>
  );
}
