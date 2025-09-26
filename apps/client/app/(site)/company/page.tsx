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
import CompanyForm from "@/components/company/company.form";
import {
  getAllCompanies,
  toggleCompanyStatus,
  deleteCompany,
} from "@/services/companyService";
import type { CompanyData } from "@/components/company/company.schema";
import { toast } from "sonner";

export default function CompanyPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");

  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openToggleModal, setOpenToggleModal] = useState(false);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      const response = await getAllCompanies({
        page: pagination.currentPage,
        search,
      });
      setCompanies(response.data.companies);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        hasNext: response.data.pagination.hasNext,
        hasPrev: response.data.pagination.hasPrev,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch companies");
    }
  }, [pagination.currentPage, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleToggleSwitch = async () => {
    if (!selectedCompany) return;
    try {
      await toggleCompanyStatus(selectedCompany._id);
      toast.success(
        `Company ${selectedCompany.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchCompanies();
      setOpenToggleModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    try {
      await deleteCompany(selectedCompany._id);
      toast.success("Company deleted successfully");
      fetchCompanies();
      setOpenDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete company");
    }
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCompany(null);
    setModalMode(null);
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    fetchCompanies();
    handleCloseModal();
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Create Company";
      case "edit":
        return "Edit Company";
      case "view":
        return "View Company";
      default:
        return "Company";
    }
  };

  const columns: ColumnDef<CompanyData>[] = [
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
      accessorKey: "creditValue",
      header: "Credit Value",
      cell: ({ row }) => `₹${row.original.creditValue}`,
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={() => {
            setSelectedCompany(row.original);
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
              setSelectedCompany(row.original);
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
              console.log("Edit button clicked for company:", row.original);
              setSelectedCompany(row.original);
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
              setSelectedCompany(row.original);
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
        label="Companies"
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
              setSelectedCompany(null);
              setModalMode("create");
              setOpenModal(true);
            }}
          >
            Add Company
          </Button>
        }
      />

      <DataTable
        data={companies}
        columns={columns}
        pagination={pagination}
        onPaginationChange={handlePageChange}
      />

      {/* Company Modal for Create/Edit/View */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          {openModal && (
            <CompanyForm
              mode={modalMode!}
              companyIds={selectedCompany?._id}
              defaultValues={selectedCompany || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Modal */}
      {openToggleModal && selectedCompany && (
        <ConfirmationModal
          open={openToggleModal}
          onOpenChange={setOpenToggleModal}
          onConfirm={handleToggleSwitch}
          title="Toggle Company Status"
          description={`Are you sure you want to ${
            selectedCompany.isActive ? "deactivate" : "activate"
          } "${selectedCompany.name}"?`}
        />
      )}

      {/* Delete Modal */}
      {openDeleteModal && selectedCompany && (
        <ConfirmationModal
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          onConfirm={handleDelete}
          title="Delete Company"
          description={`Are you sure you want to delete "${selectedCompany.name}"?`}
        />
      )}
    </div>
  );
}
