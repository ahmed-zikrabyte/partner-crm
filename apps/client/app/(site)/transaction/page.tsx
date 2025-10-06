/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";

import { DataTable } from "@workspace/ui/components/data-table";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import {
  getAllTransactions,
  exportTransactions,
  TransactionType,
} from "@/services/transactionService";
import { getAllVendors } from "@/services/vendorService";

interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  vendorId?: {
    _id: string;
    name: string;
  };
  deviceId?: {
    _id: string;
    name?: string;
    model?: string;
  };
  author: {
    authorType: "partner" | "employee";
    authorId: { _id: string; name: string };
  };
  note?: string;
  paymentMode?: "cash" | "upi" | "card";
  createdAt: string;
}

interface Vendor {
  _id: string;
  name: string;
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<TransactionType | "all">(
    "all"
  );
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<
    "cash" | "upi" | "card" | "all"
  >("all");
  const [vendorSearch, setVendorSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "sell":
        return "default";
      case "return":
        return "destructive";
      case "investment":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPaymentModeColor = (mode?: string) => {
    switch (mode) {
      case "cash":
        return "default";
      case "upi":
        return "secondary";
      case "card":
        return "outline";
      default:
        return "outline";
    }
  };

  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant={getTypeColor(row.original.type)}>
            {row.original.type.toUpperCase()}
          </Badge>
        ),
      },
      {
        accessorKey: "paymentMode",
        header: "Payment Mode",
        cell: ({ row }) => (
          <Badge variant={getPaymentModeColor(row.original.paymentMode)}>
            {row.original.paymentMode?.toUpperCase() || "N/A"}
          </Badge>
        ),
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
        cell: ({ row }) => row.original.vendorId?.name || "N/A",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span
            className={
              row.original.type === "sell" || row.original.type === "investment"
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {row.original.type === "sell" || row.original.type === "investment"
              ? "+"
              : "-"}
            ₹{row.original.amount.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "device",
        header: "Device",
        cell: ({ row }) =>
          row.original.deviceId?.model || row.original.deviceId?.name || "N/A",
      },

      {
        accessorKey: "note",
        header: "Note",
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate">
            {row.original.note || "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "author",
        header: "Created By",
        cell: ({ row }) => row.original.author.authorId.name,
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm">
            {format(new Date(row.original.createdAt), "MMM dd, yyyy HH:mm")}
          </span>
        ),
      },
    ],
    []
  );

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(selectedVendor !== "all" && { vendorId: selectedVendor }),
        ...(selectedType !== "all" && { type: selectedType }),
        ...(selectedPaymentMode !== "all" && {
          paymentMode: selectedPaymentMode,
        }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      console.log("Fetching transactions with params:", params);
      const response = await getAllTransactions(params);
      console.log("API Response:", response);

      // Handle different possible response structures
      const transactionsData =
        response.data?.transactions ||
        response.transactions ||
        response.data ||
        response ||
        [];
      console.log("Transactions data:", transactionsData);

      // Filter to only show sell, return, and investment transactions
      const filteredTransactions = Array.isArray(transactionsData)
        ? transactionsData.filter((transaction) =>
            ["sell", "return", "investment"].includes(transaction.type)
          )
        : [];

      setTransactions(filteredTransactions);
      setPagination({
        currentPage: response.currentPage || response.data?.currentPage || 1,
        totalPages: response.totalPages || response.data?.totalPages || 1,
        hasNext: response.hasNext || response.data?.hasNext || false,
        hasPrev: response.hasPrev || response.data?.hasPrev || false,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await getAllVendors({ limit: 0 });
      console.log("Vendors response:", response);
      const vendorsData =
        response.data?.vendors ||
        response.vendors ||
        response.data ||
        response ||
        [];
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        ...(search && { search }),
        ...(selectedVendor !== "all" && { vendorId: selectedVendor }),
        ...(selectedType !== "all" && { type: selectedType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      const response = await exportTransactions(params);
      const exportData = response.data || [];

      if (exportData.length === 0) {
        alert("No data to export");
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
      a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting transactions:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedVendor("all");
    setSelectedType("all");
    setSelectedPaymentMode("all");
    setStartDate("");
    setEndDate("");
    setVendorSearch("");
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchTransactions(1);
  }, [
    search,
    selectedVendor,
    selectedType,
    selectedPaymentMode,
    startDate,
    endDate,
  ]);

  const handlePaginationChange = (newPage: number) => {
    fetchTransactions(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search vendors..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <SelectItem value="all">All vendors</SelectItem>
                {Array.isArray(vendors) &&
                  vendors
                    .filter((vendor) =>
                      vendor.name
                        .toLowerCase()
                        .includes(vendorSearch.toLowerCase())
                    )
                    .map((vendor) => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as TransactionType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedPaymentMode}
              onValueChange={(value) =>
                setSelectedPaymentMode(value as "cash" | "upi" | "card" | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={transactions}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
