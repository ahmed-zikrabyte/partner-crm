/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getAllTransactions,
  exportTransactions,
} from "@/services/transactionService";
import { getPartnerProfile } from "@/services/authService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
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
import { DataTable } from "@workspace/ui/components/data-table";
import { AddTransactionDialog } from "@/components/global/add-transaction-dialog";
import { IndianRupee, Download, Search } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

interface Transaction {
  _id: string;
  vendorId?: { _id: string; name: string };
  amount: number;
  note: string;
  paymentMode?: "cash" | "upi" | "card";
  type: "return" | "sell" | "credit" | "debit" | "investment";
  date: string;
  author: {
    authorType: "partner" | "employee";
    authorId: { _id: string; name: string };
  };
  deviceId?: {
    _id: string;
    name?: string;
    model?: string;
  };
  createdAt: string;
}

export default function CashbookPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [internalTransactions, setInternalTransactions] = useState<
    Transaction[]
  >([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allInternalTransactions, setAllInternalTransactions] = useState<
    Transaction[]
  >([]);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // All transactions state
  const [allCurrentPage, setAllCurrentPage] = useState(1);
  const [allPagination, setAllPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    totalCount: 0,
  });
  const [typeFilter, setTypeFilter] = useState<"all" | "sell" | "return">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Internal transactions state
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPagination, setInternalPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    totalCount: 0,
  });
  const [internalSearch, setInternalSearch] = useState("");
  const [debouncedInternalSearch, setDebouncedInternalSearch] = useState("");
  const [internalStartDate, setInternalStartDate] = useState("");
  const [internalEndDate, setInternalEndDate] = useState("");
  const [internalTypeFilter, setInternalTypeFilter] = useState<
    "all" | "credit" | "debit"
  >("all");

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  // Debounce searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setAllCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInternalSearch(internalSearch);
      setInternalCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [internalSearch]);

  // Fetch all data for stats
  useEffect(() => {
    fetchAllData();
  }, [
    debouncedSearch,
    startDate,
    endDate,
    typeFilter,
    debouncedInternalSearch,
    internalStartDate,
    internalEndDate,
    internalTypeFilter,
  ]);

  // Fetch paginated transactions
  useEffect(() => {
    fetchCashTransactions();
  }, [allCurrentPage]);

  // Fetch paginated internal transactions
  useEffect(() => {
    fetchInternalTransactions();
  }, [internalCurrentPage]);

  // Fetch partner profile
  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const partnerResponse = await getPartnerProfile();
      setPartner(partnerResponse.data);
    } catch (error) {
      console.error("Error fetching partner:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all cash transactions for stats
      const allCashResponse = await getAllTransactions({
        search: debouncedSearch,
        startDate,
        endDate,
        type: typeFilter === "all" ? undefined : typeFilter,
        paymentMode: "cash",
        limit: 0, // Get all data for stats
      });

      // Fetch all internal transactions for stats
      const allInternalResponse = await getAllTransactions({
        search: debouncedInternalSearch,
        startDate: internalStartDate,
        endDate: internalEndDate,
        type: internalTypeFilter === "all" ? undefined : internalTypeFilter,
        limit: 0, // Get all data for stats
      });

      const allInternalTxns = allInternalResponse.data.transactions.filter(
        (transaction: Transaction) =>
          transaction.type === "credit" || transaction.type === "debit"
      );

      setAllTransactions(allCashResponse.data.transactions);
      setAllInternalTransactions(allInternalTxns);
    } catch (error) {
      console.error("Error fetching all data:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCashTransactions = async () => {
    try {
      const response = await getAllTransactions({
        search: debouncedSearch,
        startDate,
        endDate,
        page: allCurrentPage,
        type: typeFilter === "all" ? undefined : typeFilter,
        paymentMode: "cash",
      });

      setTransactions(response.data.transactions);
      setAllPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchInternalTransactions = async () => {
    try {
      // Fetch credit and debit transactions separately and combine
      const [creditResponse, debitResponse] = await Promise.all([
        getAllTransactions({
          search: debouncedInternalSearch,
          startDate: internalStartDate,
          endDate: internalEndDate,
          type: "credit",
          limit: 0,
        }),
        getAllTransactions({
          search: debouncedInternalSearch,
          startDate: internalStartDate,
          endDate: internalEndDate,
          type: "debit",
          limit: 0,
        }),
      ]);

      // Combine and sort all internal transactions
      const allInternal = [
        ...creditResponse.data.transactions,
        ...debitResponse.data.transactions,
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply pagination manually
      const startIndex = (internalCurrentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedInternal = allInternal.slice(startIndex, endIndex);

      setInternalTransactions(paginatedInternal);

      // Calculate pagination
      const totalCount = allInternal.length;
      const totalPages = Math.ceil(totalCount / 10);
      const hasNext = internalCurrentPage < totalPages;
      const hasPrev = internalCurrentPage > 1;

      setInternalPagination({
        totalPages,
        hasNext,
        hasPrev,
        totalCount,
      });
    } catch (error) {
      console.error("Error fetching internal transactions:", error);
    }
  };

  // Table columns for all transactions
  const allTransactionColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "sell" ? "default" : "destructive"}
        >
          {row.original.type === "sell" ? "Sale" : "Return"}
        </Badge>
      ),
    },
    {
      accessorKey: "vendorId",
      header: "Vendor",
      cell: ({ row }) => row.original.vendorId?.name || "N/A",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span
          className={
            row.original.type === "sell" ? "text-green-600" : "text-red-600"
          }
        >
          {row.original.type === "sell" ? "+" : "-"}₹
          {row.original.amount.toLocaleString()}
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
      cell: ({ row }) => row.original.note || "N/A",
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
  ];

  // Table columns for internal transactions
  const internalTransactionColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "credit" ? "default" : "destructive"}
        >
          {row.original.type === "credit" ? "Credit" : "Debit"}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span
          className={
            row.original.type === "credit" ? "text-green-600" : "text-red-600"
          }
        >
          {row.original.type === "credit" ? "+" : "-"}₹
          {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => row.original.note || "N/A",
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
  ];

  // Stats calculations using all data
  const cashStats = useMemo(() => {
    const totalIn = allTransactions
      .filter((t) => t.type === "sell")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOut = allTransactions
      .filter((t) => t.type === "return")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCashIn: totalIn,
      totalCashOut: totalOut,
      netCash: totalIn - totalOut,
    };
  }, [allTransactions]);

  const internalStats = useMemo(() => {
    const totalCredit = allInternalTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebit = allInternalTransactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCredit,
      totalDebit,
      netInternal: totalCredit - totalDebit,
    };
  }, [allInternalTransactions]);

  const handleExport = async (tabType: "all" | "internal") => {
    try {
      const filters: any = {};
      if (tabType === "internal") {
        if (internalStartDate) filters.startDate = internalStartDate;
        if (internalEndDate) filters.endDate = internalEndDate;
        if (debouncedInternalSearch) filters.search = debouncedInternalSearch;
        if (internalTypeFilter !== "all") filters.type = internalTypeFilter;
      } else {
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (debouncedSearch) filters.search = debouncedSearch;
        if (typeFilter !== "all") filters.type = typeFilter;
      }

      const response = await exportTransactions(filters);
      const csvContent = convertToCSV(response.data);
      downloadCSV(
        csvContent,
        tabType === "internal" ? "internal-transactions" : "cash-transactions"
      );

      toast.success("Transactions exported successfully");
    } catch (error) {
      toast.error("Failed to export transactions");
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return "";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setTypeFilter("all");
    setAllCurrentPage(1);
  };

  const clearInternalFilters = () => {
    setInternalSearch("");
    setInternalStartDate("");
    setInternalEndDate("");
    setInternalTypeFilter("all");
    setInternalCurrentPage(1);
  };

  const handleAllPageChange = (page: number) => {
    setAllCurrentPage(page);
  };

  const handleInternalPageChange = (page: number) => {
    setInternalCurrentPage(page);
  };

  const refreshData = () => {
    fetchCashTransactions();
    fetchInternalTransactions();
  };

  if (loading) {
    return <div className="p-6">Loading cash transactions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cashbook</h1>
        <Button onClick={() => setTransactionDialogOpen(true)}>
          <IndianRupee className="w-4 h-4 mr-2" />
          Add Internal Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            Total Cash Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              (partner?.cashAmount || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ₹{(partner?.cashAmount || 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            All Transactions ({allTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="internal">
            Internal Transactions ({allInternalTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Cash Transactions</h2>
              <Button onClick={() => handleExport("all")}>
                <Download className="w-4 h-4 mr-2" />
                Export Cash Transactions
              </Button>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />

              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />

              <Select
                value={typeFilter}
                onValueChange={(value: "all" | "sell" | "return") =>
                  setTypeFilter(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="sell">Sales Only</SelectItem>
                  <SelectItem value="return">Returns Only</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Cash In (Sales)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{cashStats.totalCashIn.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Cash Out (Returns)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{cashStats.totalCashOut.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${cashStats.netCash >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ₹{cashStats.netCash.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <DataTable
            data={transactions}
            columns={allTransactionColumns}
            pagination={{
              currentPage: allCurrentPage,
              ...allPagination,
            }}
            onPaginationChange={handleAllPageChange}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="internal" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Internal Transactions</h2>
              <Button onClick={() => handleExport("internal")}>
                <Download className="w-4 h-4 mr-2" />
                Export Internal Transactions
              </Button>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={internalSearch}
                  onChange={(e) => setInternalSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Input
                type="date"
                placeholder="Start Date"
                value={internalStartDate}
                onChange={(e) => setInternalStartDate(e.target.value)}
                className="w-40"
              />

              <Input
                type="date"
                placeholder="End Date"
                value={internalEndDate}
                onChange={(e) => setInternalEndDate(e.target.value)}
                className="w-40"
              />

              <Select
                value={internalTypeFilter}
                onValueChange={(value: "all" | "credit" | "debit") =>
                  setInternalTypeFilter(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credits Only</SelectItem>
                  <SelectItem value="debit">Debits Only</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearInternalFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Cash In (Credits)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{internalStats.totalCredit.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Cash Out (Debits)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{internalStats.totalDebit.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Internal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${internalStats.netInternal >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ₹{internalStats.netInternal.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <DataTable
            data={internalTransactions}
            columns={internalTransactionColumns}
            pagination={{
              currentPage: internalCurrentPage,
              ...internalPagination,
            }}
            onPaginationChange={handleInternalPageChange}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      <AddTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        entityId=""
        entityType="partner"
        onSuccess={refreshData}
      />
    </div>
  );
}
