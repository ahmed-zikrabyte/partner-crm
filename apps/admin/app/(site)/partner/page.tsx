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
import PartnerForm from "@/components/partner/partner.form";
import {
  getAllPartners,
  togglePartnerStatus,
  deletePartner,
} from "@/services/partnerService";
import type { PartnerData } from "@/components/partner/partner.schema";
import { toast } from "sonner";

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");

  const [selectedPartner, setSelectedPartner] = useState<PartnerData | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openToggleModal, setOpenToggleModal] = useState(false);

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    try {
      const response = await getAllPartners({
        page: pagination.currentPage,
        search,
      });
      setPartners(response.data.partners);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch partners");
    }
  }, [pagination.currentPage, search]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleToggleSwitch = async () => {
    if (!selectedPartner) return;
    try {
      await togglePartnerStatus(selectedPartner._id);
      toast.success(
        `Partner ${selectedPartner.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchPartners();
      setOpenToggleModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!selectedPartner) return;
    try {
      await deletePartner(selectedPartner._id);
      toast.success("Partner deleted successfully");
      fetchPartners();
      setOpenDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete partner");
    }
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPartner(null);
    setModalMode(null);
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    fetchPartners();
    handleCloseModal();
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Create Partner";
      case "edit":
        return "Edit Partner";
      case "view":
        return "View Partner";
      default:
        return "Partner";
    }
  };

  const columns: ColumnDef<PartnerData>[] = [
    {
      accessorKey: "_id",
      header: "ID",
      cell: ({ row }) => row.index + 1,
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
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={() => {
            setSelectedPartner(row.original);
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
              setSelectedPartner(row.original);
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
              console.log("Edit button clicked for partner:", row.original);
              setSelectedPartner(row.original);
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
              setSelectedPartner(row.original);
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
        label="Partners"
        filtersComponent={
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        }
        button={
          <Button
            variant="default"
            onClick={() => {
              setSelectedPartner(null);
              setModalMode("create");
              setOpenModal(true);
            }}
          >
            Add Partner
          </Button>
        }
      />

      <DataTable
        data={partners}
        columns={columns}
        pagination={pagination}
        onPaginationChange={handlePageChange}
      />

      {/* Partner Modal for Create/Edit/View */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          {openModal && (
            <PartnerForm
              mode={modalMode!}
              partnerId={selectedPartner?._id}
              defaultValues={selectedPartner || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Modal */}
      {openToggleModal && selectedPartner && (
        <ConfirmationModal
          open={openToggleModal}
          onOpenChange={setOpenToggleModal}
          onConfirm={handleToggleSwitch}
          title="Toggle Partner Status"
          description={`Are you sure you want to ${
            selectedPartner.isActive ? "deactivate" : "activate"
          } "${selectedPartner.name}"?`}
        />
      )}

      {/* Delete Modal */}
      {openDeleteModal && selectedPartner && (
        <ConfirmationModal
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          onConfirm={handleDelete}
          title="Delete Partner"
          description={`Are you sure you want to delete "${selectedPartner.name}"?`}
        />
      )}
    </div>
  );
}
