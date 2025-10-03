/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, IndianRupee, Download, Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { DataTable } from "@workspace/ui/components/data-table";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { getVendorById } from "@/services/vendorService";
import { getAllDevices } from "@/services/deviceService";
import { getAllTransactions, exportTransactions } from "@/services/transactionService";
import { AddTransactionDialog } from "@/components/global/add-transaction-dialog";
import type { VendorData } from "@/components/vendor/vendor.schema";
import { toast } from "sonner";

interface DeviceData {
  _id: string;
  deviceId: string;
  brand: string;
  model: string;
  imei1: string;
  selling: number;
  profit: number;
  isActive: boolean;
  createdAt: string;
  companyIds?: string;
}

export default function VendorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [vendorId, setVendorId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        const resolvedParams = await params;
        setVendorId(resolvedParams.id);
        const [vendorRes, devicesRes, transactionsRes] = await Promise.all([
          getVendorById(resolvedParams.id),
          getAllDevices({ limit: 0 }),
          getAllTransactions({ vendorId: resolvedParams.id, search, startDate, endDate }),
        ]);

        // Filter devices based on latest transaction with this vendor
        const vendorDevices = devicesRes.data.devices?.filter((device: any) => {
          const sellHistory = device.sellHistory || [];
          const vendorTransactions = sellHistory.filter((history: any) => 
            history.vendor?._id === resolvedParams.id
          );
          
          if (vendorTransactions.length === 0) return false;
          
          // Get the latest transaction with this vendor
          const latestTransaction = vendorTransactions.sort((a: any, b: any) => 
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          )[0];
          
          // Show device only if latest transaction is a sell
          return latestTransaction.type === 'sell';
        }) || [];

        setVendor(vendorRes.data);
        setDevices(vendorDevices);
        setTransactions(transactionsRes.data || []);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to fetch vendor details");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [params, search, startDate, endDate]);

  const handleExport = async () => {
    try {
      const filters: any = { vendorId };
      if (search) filters.search = search;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const response = await exportTransactions(filters);
      
      const csvContent = convertToCSV(response.data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendor-${vendor?.name}-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
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
      header: "Latest Selling Price",
      cell: ({ row }) => {
        const device = row.original as any;
        const sellHistory = device.sellHistory?.filter((h: any) => h.type === 'sell') || [];
        const latestSell = sellHistory.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())[0];
        const sellingPrice = latestSell?.selling || latestSell?.amount || device.selling || 0;
        return `₹${sellingPrice}`;
      },
    },
    {
      accessorKey: "returns",
      header: "Returns",
      cell: ({ row }) => {
        const device = row.original as any;
        const returnCount = device.sellHistory?.filter((h: any) => h.type === 'return').length || 0;
        return returnCount;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const transactionColumns: ColumnDef<any>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          className="capitalize"
          variant={row.original.type === "sell" ? "default" : "secondary"}
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "paymentMode",
      header: "Payment Mode",
      cell: ({ row }) => row.original.paymentMode?.toUpperCase(),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₹${row.original.amount || 0}`,
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => row.original.note || "-",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.date).toLocaleDateString("en-GB", {
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

  if (!vendor) {
    return (
      <div className="flex justify-center items-center h-64">
        Vendor not found
      </div>
    );
  }

  const totalDevices = devices.length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Vendor Details</h1>
        <Button
          onClick={() => setTransactionDialogOpen(true)}
          className="ml-auto"
        >
          <IndianRupee className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Vendor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg font-semibold">{vendor.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Amount
              </label>
              <p className="text-lg font-semibold">₹{vendor.amount || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <div className="mt-1">
                <Badge variant={vendor.isActive ? "default" : "secondary"}>
                  {vendor.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Transactions and Devices */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="devices">Devices ({totalDevices})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transactions</CardTitle>
                <Button onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Transactions
                </Button>
              </div>
              
              <div className="flex gap-3 items-center flex-wrap mt-4">
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
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearch("");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={transactions}
                columns={transactionColumns}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false,
                }}
                onPaginationChange={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Devices</CardTitle>
              </div>
              
              <div className="flex gap-3 items-center flex-wrap mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search devices by ID, brand, model, or IMEI..."
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setDeviceSearch("")}
                >
                  Clear Search
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={devices.filter(device => 
                  !deviceSearch || 
                  device.deviceId?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                  device.brand?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                  device.model?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                  device.imei1?.toLowerCase().includes(deviceSearch.toLowerCase())
                )}
                columns={deviceColumns}
                pagination={{
                  currentPage: 1,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false,
                }}
                onPaginationChange={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        entityId={vendorId}
        entityType="vendor"
        onSuccess={async () => {
          const [vendorRes, transactionsRes] = await Promise.all([
            getVendorById(vendorId),
            getAllTransactions({ vendorId: vendorId, search, startDate, endDate }),
          ]);
          setVendor(vendorRes.data);
          setTransactions(transactionsRes.data || []);
        }}
      />
    </div>
  );
}
