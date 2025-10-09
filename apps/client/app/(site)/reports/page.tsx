"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@workspace/ui/components/select";
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  Smartphone,
  Receipt,
  Users,
  Building2,
  Calendar,
  Filter,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DataTable } from "@workspace/ui/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

// Import services
import { getAllDevices } from "@/services/deviceService";
import { getAllTransactions } from "@/services/transactionService";
import { getAllVendors } from "@/services/vendorService";
import { getAllCompanies } from "@/services/companyService";

// Excel export utility
import * as XLSX from 'xlsx';

interface ReportFilters {
  startDate: string;
  endDate: string;
  vendorId?: string;
  companyId?: string;
  deviceId?: string;
}

interface ProfitData {
  deviceId: string;
  deviceModel: string;
  deviceBrand: string;
  initialCost: number;
  sellingPrice: number;
  profit: number;
  soldDate: string;
  vendor: string;
  company: string;
}

interface DeviceData {
  _id: string;
  deviceId: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  initialCost: number;
  cost: number;
  credit: number;
  selling?: number;
  profit?: number;
  soldTo?: string;
  pickedBy: string;
  warranty: string;
  issues: string;
  createdAt: string;
}

interface TransactionData {
  _id: string;
  type: string;
  amount: number;
  vendor: string;
  device: string;
  paymentMode: string;
  note: string;
  author: string;
  createdAt: string;
}

interface VendorReportData {
  vendorId: string;
  vendorName: string;
  totalTransactions: number;
  totalAmount: number;
  totalSales: number;
  totalReturns: number;
  devicesSold: number;
  lastTransactionDate: string;
}

interface CompanyReportData {
  companyId: string;
  companyName: string;
  totalDevices: number;
  soldDevices: number;
  availableDevices: number;
  totalValue: number;
  totalProfit: number;
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  // Data states
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);
  const [vendorReports, setVendorReports] = useState<VendorReportData[]>([]);
  const [companyReports, setCompanyReports] = useState<CompanyReportData[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vendorsRes, companiesRes] = await Promise.all([
        getAllVendors({ limit: 0 }),
        getAllCompanies({ limit: 0 })
      ]);

      setVendors(vendorsRes.data?.vendors || vendorsRes.vendors || vendorsRes.data || []);
      setCompanies(companiesRes.data?.companies || companiesRes.companies || companiesRes.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    }
  };

  const fetchReportsData = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setLoading(true);
    try {
      // Fetch all data with filters
      const [devicesRes, transactionsRes] = await Promise.all([
        getAllDevices({
          limit: 0,
          startDate: filters.startDate,
          endDate: filters.endDate,
          ...(filters.companyId && { companyId: filters.companyId })
        }),
        getAllTransactions({
          limit: 0,
          startDate: filters.startDate,
          endDate: filters.endDate,
          ...(filters.vendorId && { vendorId: filters.vendorId })
        })
      ]);

      const devices = devicesRes.data?.devices || devicesRes.devices || devicesRes.data || [];
      const transactions = transactionsRes.data?.transactions || transactionsRes.transactions || transactionsRes.data || [];

      console.log("Devices fetched:", devices?.length || 0);
      console.log("Transactions fetched:", transactions?.length || 0);

      // Process profit data
      const profits: ProfitData[] = devices
        .filter((device: any) => device.selling && device.profit)
        .map((device: any) => ({
          deviceId: device.deviceId || device._id,
          deviceModel: device.model,
          deviceBrand: device.brand,
          initialCost: device.initialCost,
          sellingPrice: device.selling,
          profit: device.profit,
          soldDate: device.sellHistory?.[0]?.createdAt || device.updatedAt,
          vendor: device.sellHistory?.[0]?.vendor?.name || device.soldTo || "N/A",
          company: device.selectedCompanyIds || "N/A"
        }));

      // Process device data
      const processedDevices: DeviceData[] = devices.map((device: any) => ({
        _id: device._id,
        deviceId: device.deviceId || device._id,
        brand: device.brand,
        model: device.model,
        imei1: device.imei1,
        imei2: device.imei2,
        initialCost: device.initialCost,
        cost: device.cost,
        credit: device.credit,
        selling: device.selling,
        profit: device.profit,
        soldTo: device.soldTo,
        pickedBy: device.pickedBy,
        warranty: device.warranty,
        issues: device.issues,
        createdAt: device.createdAt
      }));

      // Process transaction data
      const processedTransactions: TransactionData[] = transactions.map((txn: any) => ({
        _id: txn._id,
        type: txn.type,
        amount: txn.amount,
        vendor: txn.vendorId?.name || "N/A",
        device: txn.deviceId?.model || txn.deviceId?.name || "N/A",
        paymentMode: txn.paymentMode || "N/A",
        note: txn.note || "",
        author: txn.author?.authorId?.name || "N/A",
        createdAt: txn.createdAt
      }));

      // Generate vendor reports
      const vendorReportsData = generateVendorReports(transactions, devices);

      // Generate company reports
      const companyReportsData = generateCompanyReports(devices);

      console.log("Generated vendor reports:", vendorReportsData?.length || 0);
      console.log("Generated company reports:", companyReportsData?.length || 0);

      setProfitData(profits);
      setDeviceData(processedDevices);
      setTransactionData(processedTransactions);
      setVendorReports(vendorReportsData);
      setCompanyReports(companyReportsData);

      toast.success("Reports generated successfully");
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast.error("Failed to generate reports");
    } finally {
      setLoading(false);
    }
  };

  const generateVendorReports = (transactions: any[], devices: any[]): VendorReportData[] => {
    const vendorMap = new Map();

    // Process transactions
    transactions.forEach(txn => {
      if (!txn.vendorId) return;

      const vendorId = typeof txn.vendorId === 'string' ? txn.vendorId : txn.vendorId._id;
      const vendorName = typeof txn.vendorId === 'string' ?
        vendors.find(v => v._id === txn.vendorId)?.name || 'Unknown' :
        txn.vendorId.name;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId,
          vendorName,
          totalTransactions: 0,
          totalAmount: 0,
          totalSales: 0,
          totalReturns: 0,
          devicesSold: 0,
          lastTransactionDate: txn.createdAt
        });
      }

      const vendor = vendorMap.get(vendorId);
      vendor.totalTransactions++;
      vendor.totalAmount += txn.amount;

      if (txn.type === "sell") {
        vendor.totalSales += txn.amount;
        vendor.devicesSold++;
      } else if (txn.type === "return") {
        vendor.totalReturns += txn.amount;
      }

      if (new Date(txn.createdAt) > new Date(vendor.lastTransactionDate)) {
        vendor.lastTransactionDate = txn.createdAt;
      }
    });

    // Add vendors that have no transactions in the date range
    vendors.forEach(vendor => {
      if (!vendorMap.has(vendor._id)) {
        vendorMap.set(vendor._id, {
          vendorId: vendor._id,
          vendorName: vendor.name,
          totalTransactions: 0,
          totalAmount: 0,
          totalSales: 0,
          totalReturns: 0,
          devicesSold: 0,
          lastTransactionDate: new Date().toISOString()
        });
      }
    });

    return Array.from(vendorMap.values());
  };

  const generateCompanyReports = (devices: any[]): CompanyReportData[] => {
    const companyMap = new Map();

    devices.forEach(device => {
      const companyId = device.selectedCompanyIds || device.companyIds || "Unknown";
      const companyName = companies.find(c => c._id === companyId)?.name || companyId;

      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, {
          companyId,
          companyName,
          totalDevices: 0,
          soldDevices: 0,
          availableDevices: 0,
          totalValue: 0,
          totalProfit: 0
        });
      }

      const company = companyMap.get(companyId);
      company.totalDevices++;
      company.totalValue += device.cost || 0;

      if (device.selling) {
        company.soldDevices++;
        company.totalProfit += device.profit || 0;
      } else {
        company.availableDevices++;
      }
    });

    // Add companies that have no devices in the date range
    companies.forEach(company => {
      if (!companyMap.has(company._id)) {
        companyMap.set(company._id, {
          companyId: company._id,
          companyName: company.name,
          totalDevices: 0,
          soldDevices: 0,
          availableDevices: 0,
          totalValue: 0,
          totalProfit: 0
        });
      }
    });

    return Array.from(companyMap.values());
  };

  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const dateRange = filters.startDate && filters.endDate
        ? `_${filters.startDate}_to_${filters.endDate}`
        : `_${format(new Date(), 'yyyy-MM-dd')}`;

      XLSX.writeFile(wb, `${filename}${dateRange}.xlsx`);
      toast.success(`${sheetName} exported successfully`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Table columns
  const profitColumns: ColumnDef<ProfitData>[] = [
    { accessorKey: "deviceId", header: "Device ID" },
    { accessorKey: "deviceBrand", header: "Brand" },
    { accessorKey: "deviceModel", header: "Model" },
    {
      accessorKey: "initialCost",
      header: "Initial Cost",
      cell: ({ row }) => `₹${row.original.initialCost.toLocaleString()}`
    },
    {
      accessorKey: "sellingPrice",
      header: "Selling Price",
      cell: ({ row }) => `₹${row.original.sellingPrice.toLocaleString()}`
    },
    {
      accessorKey: "profit",
      header: "Profit",
      cell: ({ row }) => (
        <span className={row.original.profit >= 0 ? "text-green-600" : "text-red-600"}>
          ₹{row.original.profit.toLocaleString()}
        </span>
      )
    },
    { accessorKey: "vendor", header: "Vendor" },
    { accessorKey: "company", header: "Company" },
    {
      accessorKey: "soldDate",
      header: "Sold Date",
      cell: ({ row }) => format(new Date(row.original.soldDate), "MMM dd, yyyy")
    }
  ];

  const deviceColumns: ColumnDef<DeviceData>[] = [
    { accessorKey: "deviceId", header: "Device ID" },
    { accessorKey: "brand", header: "Brand" },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "imei1", header: "IMEI 1" },
    {
      accessorKey: "initialCost",
      header: "Initial Cost",
      cell: ({ row }) => `₹${row.original.initialCost.toLocaleString()}`
    },
    {
      accessorKey: "selling",
      header: "Selling Price",
      cell: ({ row }) => row.original.selling ? `₹${row.original.selling.toLocaleString()}` : "Not Sold"
    },
    {
      accessorKey: "profit",
      header: "Profit",
      cell: ({ row }) => row.original.profit ? (
        <span className={row.original.profit >= 0 ? "text-green-600" : "text-red-600"}>
          ₹{row.original.profit.toLocaleString()}
        </span>
      ) : "N/A"
    },
    { accessorKey: "pickedBy", header: "Picked By" },
    { accessorKey: "warranty", header: "Warranty" }
  ];

  const transactionColumns: ColumnDef<TransactionData>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.type === "sell" ? "default" : "destructive"}>
          {row.original.type.toUpperCase()}
        </Badge>
      )
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className={row.original.type === "sell" ? "text-green-600" : "text-red-600"}>
          {row.original.type === "sell" ? "+" : "-"}₹{row.original.amount.toLocaleString()}
        </span>
      )
    },
    { accessorKey: "vendor", header: "Vendor" },
    { accessorKey: "device", header: "Device" },
    { accessorKey: "paymentMode", header: "Payment Mode" },
    { accessorKey: "author", header: "Created By" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM dd, yyyy HH:mm")
    }
  ];

  const vendorReportColumns: ColumnDef<VendorReportData>[] = [
    { accessorKey: "vendorName", header: "Vendor Name" },
    { accessorKey: "totalTransactions", header: "Total Transactions" },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => `₹${row.original.totalAmount.toLocaleString()}`
    },
    {
      accessorKey: "totalSales",
      header: "Total Sales",
      cell: ({ row }) => `₹${row.original.totalSales.toLocaleString()}`
    },
    {
      accessorKey: "totalReturns",
      header: "Total Returns",
      cell: ({ row }) => `₹${row.original.totalReturns.toLocaleString()}`
    },
    { accessorKey: "devicesSold", header: "Devices Sold" },
    {
      accessorKey: "lastTransactionDate",
      header: "Last Transaction",
      cell: ({ row }) => format(new Date(row.original.lastTransactionDate), "MMM dd, yyyy")
    }
  ];

  const companyReportColumns: ColumnDef<CompanyReportData>[] = [
    { accessorKey: "companyName", header: "Company" },
    { accessorKey: "totalDevices", header: "Total Devices" },
    { accessorKey: "soldDevices", header: "Sold Devices" },
    { accessorKey: "availableDevices", header: "Available Devices" },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => `₹${row.original.totalValue.toLocaleString()}`
    },
    {
      accessorKey: "totalProfit",
      header: "Total Profit",
      cell: ({ row }) => (
        <span className={row.original.totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
          ₹{row.original.totalProfit.toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filters.startDate && filters.endDate
              ? `${filters.startDate} to ${filters.endDate}`
              : "Select date range to generate reports"
            }
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Vendor</label>
              <Select
                value={filters.vendorId || ""}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  vendorId: value === "all" ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Company</label>
              <Select
                value={filters.companyId || ""}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  companyId: value === "all" ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company._id} value={company._id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchReportsData}
                disabled={loading || !filters.startDate || !filters.endDate}
                className="w-full gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Generate Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="profits" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profits" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Profits
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Companies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profits" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Profit Reports</h2>
            <Button
              onClick={() => exportToExcel(profitData, "profit_report", "Profits")}
              disabled={profitData.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={profitColumns}
                data={profitData}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Device Reports</h2>
            <Button
              onClick={() => exportToExcel(deviceData, "device_report", "Devices")}
              disabled={deviceData.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={deviceColumns}
                data={deviceData}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Transaction Reports</h2>
            <Button
              onClick={() => exportToExcel(transactionData, "transaction_report", "Transactions")}
              disabled={transactionData.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={transactionColumns}
                data={transactionData}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vendor Reports</h2>
            <Button
              onClick={() => exportToExcel(vendorReports, "vendor_report", "Vendors")}
              disabled={vendorReports.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={vendorReportColumns}
                data={vendorReports}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Company Reports</h2>
            <Button
              onClick={() => exportToExcel(companyReports, "company_report", "Companies")}
              disabled={companyReports.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={companyReportColumns}
                data={companyReports}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}