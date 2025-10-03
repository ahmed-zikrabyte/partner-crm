/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
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
import EmployeeForm from "@/components/employee/employee.form";
import {
  getAllEmployees,
  toggleEmployeeStatus,
  deleteEmployee,
} from "@/services/employeeService";
import type { EmployeeData } from "@/components/employee/employee.schema";
import { toast } from "sonner";

export default function EmployeePage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(false);

  // Separate state for better control
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [pagination, setPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openToggleModal, setOpenToggleModal] = useState(false);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch employees - simplified dependencies
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await getAllEmployees({
          page: currentPage,
          search: debouncedSearch,
        });

        setEmployees(response.data.employees);
        setPagination({
          totalPages: response.data.pagination.totalPages,
          hasNext: response.data.pagination.hasNext,
          hasPrev: response.data.pagination.hasPrev,
        });
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.message || "Failed to fetch employees"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentPage, debouncedSearch]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await getAllEmployees({
        page: currentPage,
        search: debouncedSearch,
      });

      setEmployees(response.data.employees);
      setPagination({
        totalPages: response.data.pagination.totalPages,
        hasNext: response.data.pagination.hasNext,
        hasPrev: response.data.pagination.hasPrev,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSwitch = async () => {
    if (!selectedEmployee) return;
    try {
      await toggleEmployeeStatus(selectedEmployee._id);
      toast.success(
        `Employee ${selectedEmployee.isActive ? "deactivated" : "activated"} successfully`
      );
      await refreshData();
      setOpenToggleModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee(selectedEmployee._id);
      toast.success("Employee deleted successfully");
      await refreshData();
      setOpenDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete employee");
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEmployee(null);
    setModalMode(null);
  };

  const handleFormSuccess = () => {
    refreshData();
    handleCloseModal();
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Create Employee";
      case "edit":
        return "Edit Employee";
      case "view":
        return "View Employee";
      default:
        return "Employee";
    }
  };

  const columns: ColumnDef<EmployeeData>[] = [
    {
      accessorKey: "_id",
      header: "Sl.No",
      cell: ({ row }) => (currentPage - 1) * 10 + row.index + 1,
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
    },
    {
      accessorKey: "salaryPerDay",
      header: "Salary/Day",
      cell: ({ row }) => `₹${row.original.salaryPerDay}`,
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          checked={row.original.isActive}
          onCheckedChange={() => {
            setSelectedEmployee(row.original);
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
              setSelectedEmployee(row.original);
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
              setSelectedEmployee(row.original);
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
              setSelectedEmployee(row.original);
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
        label="Employees"
        filtersComponent={
          <Input
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        }
        button={
          <Button
            variant="default"
            onClick={() => {
              setSelectedEmployee(null);
              setModalMode("create");
              setOpenModal(true);
            }}
          >
            Add Employee
          </Button>
        }
      />

      <DataTable
        data={employees}
        columns={columns}
        pagination={{
          currentPage,
          ...pagination,
        }}
        onPaginationChange={handlePageChange}
        loading={loading}
      />

      {/* Employee Modal */}
      <Dialog open={openModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          {openModal && (
            <EmployeeForm
              mode={modalMode!}
              employeeId={selectedEmployee?._id}
              defaultValues={selectedEmployee || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Modal */}
      {openToggleModal && selectedEmployee && (
        <ConfirmationModal
          open={openToggleModal}
          onOpenChange={setOpenToggleModal}
          onConfirm={handleToggleSwitch}
          title="Toggle Employee Status"
          description={`Are you sure you want to ${
            selectedEmployee.isActive ? "deactivate" : "activate"
          } "${selectedEmployee.name}"?`}
        />
      )}

      {/* Delete Modal */}
      {openDeleteModal && selectedEmployee && (
        <ConfirmationModal
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          onConfirm={handleDelete}
          title="Delete Employee"
          description={`Are you sure you want to delete "${selectedEmployee.name}"?`}
        />
      )}
    </div>
  );
}
