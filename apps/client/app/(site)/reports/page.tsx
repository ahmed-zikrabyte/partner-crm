/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@workspace/ui/components/searchable-select";
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
  BarChart3,
  Eye,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DataTable } from "@workspace/ui/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

// Import services
import { getAllDevices } from "@/services/deviceService";
import { getAllTransactions } from "@/services/transactionService";
import { getAllVendors } from "@/services/vendorService";
import { getAllCompanies } from "@/services/companyService";
import { getAllEmployees } from "@/services/employeeService";

// Excel export utility
import * as XLSX from "xlsx";

interface ReportFilters {
  startDate: string;
  endDate: string;
  vendorId?: string;
  companyId?: string;
  employeeId?: string;
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
  soldTo?: string;
  pickedBy: any;
  companyIds: any;
  selectedCompanyIds?: any;
  sellHistory?: any[];
  warranty: string;
  issues: string;
  createdAt: string;
  status: string;
  profit?: number;
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
  vendorAmount?: number;
  isActive?: boolean;
}

interface CompanyReportData {
  companyId: string;
  companyName: string;
  totalDevices: number;
  soldDevices: number;
  availableDevices: number;
  totalValue: number;
  creditValue: number;
  isActive: boolean;
  companyIds: string[];
}

interface EmployeeReportData {
  employeeId: string;
  employeeName: string;
  email: string;
  phone: string;
  salaryPerDay: number;
  isActive: boolean;
  totalDevicesHandled: number;
  soldDevices: number;
  availableDevices: number;
  totalSalesValue: number;
  lastActivity: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Data states
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);
  const [vendorReports, setVendorReports] = useState<VendorReportData[]>([]);
  const [companyReports, setCompanyReports] = useState<CompanyReportData[]>([]);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReportData[]>(
    []
  );

  // Pagination states for each table
  const [devicePage, setDevicePage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  
  const [devicePagination, setDevicePagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [transactionPagination, setTransactionPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [vendorPagination, setVendorPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [companyPagination, setCompanyPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [employeePagination, setEmployeePagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });





  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
    loadAllData(); // Load all data initially
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vendorsRes, companiesRes, employeesRes] = await Promise.all([
        getAllVendors({ limit: 0 }),
        getAllCompanies({ limit: 0 }),
        getAllEmployees({ limit: 0 }),
      ]);

      const vendorsData =
        vendorsRes.data?.vendors || vendorsRes.vendors || vendorsRes.data || [];
      const companiesData =
        companiesRes.data?.companies ||
        companiesRes.companies ||
        companiesRes.data ||
        [];
      const employeesData =
        employeesRes.data?.employees ||
        employeesRes.employees ||
        employeesRes.data ||
        [];

      setVendors(vendorsData);
      setCompanies(companiesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data without any filters
      const [devicesRes, transactionsRes, vendorsRes, companiesRes, employeesRes] = await Promise.all([
        getAllDevices({ page: devicePage }),
        getAllTransactions({ page: transactionPage }),
        getAllVendors({ page: vendorPage }),
        getAllCompanies({ page: companyPage }),
        getAllEmployees({ page: employeePage }),
      ]);

      const devices = devicesRes.data?.devices || [];
      const transactions = transactionsRes.data?.transactions || [];
      const vendorsData = vendorsRes.data?.vendors || vendorsRes.vendors || vendorsRes.data || [];
      const companiesData = companiesRes.data?.companies || companiesRes.companies || companiesRes.data || [];
      const employeesData = employeesRes.data?.employees || employeesRes.employees || employeesRes.data || [];
      
      // Set pagination info for all tables
      if (devicesRes.data?.pagination) {
        setDevicePagination({
          totalPages: devicesRes.data.pagination.totalPages,
          hasNext: devicesRes.data.pagination.hasNext,
          hasPrev: devicesRes.data.pagination.hasPrev,
        });
      }
      if (transactionsRes.data?.pagination) {
        setTransactionPagination({
          totalPages: transactionsRes.data.pagination.totalPages,
          hasNext: transactionsRes.data.pagination.hasNext,
          hasPrev: transactionsRes.data.pagination.hasPrev,
        });
      }
      if (vendorsRes.data?.pagination) {
        setVendorPagination({
          totalPages: vendorsRes.data.pagination.totalPages,
          hasNext: vendorsRes.data.pagination.hasNext,
          hasPrev: vendorsRes.data.pagination.hasPrev,
        });
      }
      if (companiesRes.data?.pagination) {
        setCompanyPagination({
          totalPages: companiesRes.data.pagination.totalPages,
          hasNext: companiesRes.data.pagination.hasNext,
          hasPrev: companiesRes.data.pagination.hasPrev,
        });
      }
      if (employeesRes.data?.pagination) {
        setEmployeePagination({
          totalPages: employeesRes.data.pagination.totalPages,
          hasNext: employeesRes.data.pagination.hasNext,
          hasPrev: employeesRes.data.pagination.hasPrev,
        });
      }

      // Process device data
      const processedDevices: DeviceData[] = devices.map((device: any) => ({
        _id: device._id,
        deviceId: device.deviceId || device._id,
        brand: device.brand || "N/A",
        model: device.model || "N/A",
        imei1: device.imei1 || "N/A",
        imei2: device.imei2,
        initialCost: device.initialCost || device.cost || 0,
        cost: device.cost || 0,
        credit: device.credit || 0,
        selling: device.selling,
        soldTo: device.soldTo,
        pickedBy: device.pickedBy,
        companyIds: device.companyIds,
        selectedCompanyIds: device.selectedCompanyIds,
        sellHistory: device.sellHistory,
        warranty: device.warranty || "N/A",
        issues: device.issues || "N/A",
        createdAt: device.createdAt,
        status: getDeviceStatus(device),
        profit: device.profit,
      }));

      // Process transaction data
      const processedTransactions: TransactionData[] = transactions.map((txn: any) => ({
        _id: txn._id,
        type: txn.type,
        amount: txn.amount,
        vendor: txn.vendorId?.name || "N/A",
        device: txn.deviceId?.model || txn.deviceId?.deviceId || "N/A",
        paymentMode: txn.paymentMode || "N/A",
        note: txn.note || "",
        author: txn.author?.authorId?.name || "N/A",
        createdAt: txn.createdAt,
      }));

      // Generate reports for all data
      const vendorReportsData = generateVendorReports(transactions, devices, vendorsData);
      const companyReportsData = generateCompanyReports(devices, companiesData);
      const employeeReportsData = generateEmployeeReports(devices, employeesData);

      setDeviceData(processedDevices);
      setTransactionData(processedTransactions);
      setVendorReports(vendorReportsData);
      setCompanyReports(companyReportsData);
      setEmployeeReports(employeeReportsData);
    } catch (error) {
      console.error("Error loading all data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsData = async () => {
    // Only require dates if any filter is applied
    const hasFilters = filters.vendorId || filters.companyId || filters.employeeId;
    if (hasFilters && (!filters.startDate || !filters.endDate)) {
      toast.error("Please select both start and end dates when using filters");
      return;
    }

    setLoading(true);
    try {
      // Build filter params with pagination
      const deviceFilters: any = {
        page: devicePage,
        filter: {},
      };

      const transactionFilters: any = {
        page: transactionPage,
        filter: {},
      };

      // Apply date filters if provided
      if (filters.startDate) {
        deviceFilters.filter.startDate = filters.startDate;
        transactionFilters.filter.startDate = filters.startDate;
      }
      if (filters.endDate) {
        deviceFilters.filter.endDate = filters.endDate;
        transactionFilters.filter.endDate = filters.endDate;
      }

      // Apply specific filters
      if (filters.companyId) {
        deviceFilters.filter.companyIds = filters.companyId;
      }
      if (filters.vendorId) {
        transactionFilters.filter.vendorId = filters.vendorId;
        deviceFilters.filter.vendorId = filters.vendorId;
      }
      if (filters.employeeId) {
        deviceFilters.filter.pickedBy = filters.employeeId;
      }

      // Build filter params for other tables - get all data to filter on frontend
      const vendorFilters: any = {
        page: vendorPage,
        limit: 0, // Get all vendors to filter on frontend
      };
      const companyFilters: any = {
        page: companyPage,
        limit: 0, // Get all companies to filter on frontend
      };
      const employeeFilters: any = {
        page: employeePage,
        limit: 0, // Get all employees to filter on frontend
      };

      // Fetch data with filters and pagination
      const [devicesRes, transactionsRes, vendorsRes, companiesRes, employeesRes] = await Promise.all([
        getAllDevices(deviceFilters),
        getAllTransactions(transactionFilters),
        getAllVendors(vendorFilters),
        getAllCompanies(companyFilters),
        getAllEmployees(employeeFilters),
      ]);

      const devices = devicesRes.data?.devices || [];
      const transactions = transactionsRes.data?.transactions || [];
      let vendorsData = vendorsRes.data?.vendors || vendorsRes.vendors || vendorsRes.data || [];
      let companiesData = companiesRes.data?.companies || companiesRes.companies || companiesRes.data || [];
      let employeesData = employeesRes.data?.employees || employeesRes.employees || employeesRes.data || [];
      
      // Filter data on frontend if specific items are selected
      if (filters.vendorId) {
        vendorsData = vendorsData.filter((vendor: any) => vendor._id === filters.vendorId);
      }
      if (filters.companyId) {
        companiesData = companiesData.filter((company: any) => company._id === filters.companyId);
      }
      if (filters.employeeId) {
        employeesData = employeesData.filter((employee: any) => employee._id === filters.employeeId);
      }

      // Set pagination info
      if (devicesRes.data?.pagination) {
        setDevicePagination({
          totalPages: devicesRes.data.pagination.totalPages,
          hasNext: devicesRes.data.pagination.hasNext,
          hasPrev: devicesRes.data.pagination.hasPrev,
        });
      }
      if (transactionsRes.data?.pagination) {
        setTransactionPagination({
          totalPages: transactionsRes.data.pagination.totalPages,
          hasNext: transactionsRes.data.pagination.hasNext,
          hasPrev: transactionsRes.data.pagination.hasPrev,
        });
      }
      if (vendorsRes.data?.pagination) {
        setVendorPagination({
          totalPages: vendorsRes.data.pagination.totalPages,
          hasNext: vendorsRes.data.pagination.hasNext,
          hasPrev: vendorsRes.data.pagination.hasPrev,
        });
      }
      if (companiesRes.data?.pagination) {
        setCompanyPagination({
          totalPages: companiesRes.data.pagination.totalPages,
          hasNext: companiesRes.data.pagination.hasNext,
          hasPrev: companiesRes.data.pagination.hasPrev,
        });
      }
      if (employeesRes.data?.pagination) {
        setEmployeePagination({
          totalPages: employeesRes.data.pagination.totalPages,
          hasNext: employeesRes.data.pagination.hasNext,
          hasPrev: employeesRes.data.pagination.hasPrev,
        });
      }

      // Process device data with proper structure
      const processedDevices: DeviceData[] = devices.map((device: any) => ({
        _id: device._id,
        deviceId: device.deviceId || device._id,
        brand: device.brand || "N/A",
        model: device.model || "N/A",
        imei1: device.imei1 || "N/A",
        imei2: device.imei2,
        initialCost: device.initialCost || device.cost || 0,
        cost: device.cost || 0,
        credit: device.credit || 0,
        selling: device.selling,
        soldTo: device.soldTo,
        pickedBy: device.pickedBy,
        companyIds: device.companyIds,
        selectedCompanyIds: device.selectedCompanyIds,
        sellHistory: device.sellHistory,
        warranty: device.warranty || "N/A",
        issues: device.issues || "N/A",
        createdAt: device.createdAt,
        status: getDeviceStatus(device),
        profit: device.profit,
      }));

      // Process transaction data - filter by vendor if selected
      let filteredTransactions = transactions;
      if (filters.vendorId) {
        filteredTransactions = transactions.filter((txn: any) => {
          const vendorId =
            typeof txn.vendorId === "string" ? txn.vendorId : txn.vendorId?._id;
          return vendorId === filters.vendorId;
        });
      }

      const processedTransactions: TransactionData[] = filteredTransactions.map(
        (txn: any) => ({
          _id: txn._id,
          type: txn.type,
          amount: txn.amount,
          vendor: txn.vendorId?.name || "N/A",
          device: txn.deviceId?.model || txn.deviceId?.deviceId || "N/A",
          paymentMode: txn.paymentMode || "N/A",
          note: txn.note || "",
          author: txn.author?.authorId?.name || "N/A",
          createdAt: txn.createdAt,
        })
      );

      // Generate reports
      const vendorReportsData = generateVendorReports(
        filteredTransactions,
        devices,
        vendorsData
      );
      const companyReportsData = generateCompanyReports(devices, companiesData);
      const employeeReportsData = generateEmployeeReports(devices, employeesData);

      setDeviceData(processedDevices);
      setTransactionData(processedTransactions);
      setVendorReports(vendorReportsData);
      setCompanyReports(companyReportsData);
      setEmployeeReports(employeeReportsData);

      if (processedDevices.length > 0 || processedTransactions.length > 0) {
        toast.success("Reports generated successfully");
      }
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast.error("Failed to generate reports");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine device status
  const getDeviceStatus = (device: any) => {
    if (device.sellHistory && device.sellHistory.length > 0) {
      const lastEntry = device.sellHistory[device.sellHistory.length - 1];
      if (lastEntry.type === "return") return "Returned";
      if (lastEntry.type === "sell") return "Sold";
    }
    return "Available";
  };



  const handleDevicePageChange = (page: number) => {
    setDevicePage(page);
  };
  
  const handleTransactionPageChange = (page: number) => {
    setTransactionPage(page);
  };
  
  const handleVendorPageChange = (page: number) => {
    setVendorPage(page);
  };
  
  const handleCompanyPageChange = (page: number) => {
    setCompanyPage(page);
  };
  
  const handleEmployeePageChange = (page: number) => {
    setEmployeePage(page);
  };

  // Refetch data when page changes
  useEffect(() => {
    if (hasActiveFilters()) {
      fetchReportsData();
    } else {
      loadAllData();
    }
  }, [devicePage, transactionPage, vendorPage, companyPage, employeePage]);

  const clearAllFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      vendorId: undefined,
      companyId: undefined,
      employeeId: undefined,
    });
    setDevicePage(1);
    setTransactionPage(1);
    setVendorPage(1);
    setCompanyPage(1);
    setEmployeePage(1);
    // Load all data when filters are cleared
    loadAllData();
  };

  const hasActiveFilters = () => {
    return (
      filters.startDate ||
      filters.endDate ||
      filters.vendorId ||
      filters.companyId ||
      filters.employeeId
    );
  };

  const generateVendorReports = (
    transactions: any[],
    devices: any[],
    vendorsData: any[]
  ): VendorReportData[] => {
    const vendorMap = new Map();

    transactions.forEach((txn) => {
      if (!txn.vendorId) return;

      const vendorId =
        typeof txn.vendorId === "string" ? txn.vendorId : txn.vendorId._id;
      const vendorName =
        typeof txn.vendorId === "string"
          ? vendors.find((v) => v._id === txn.vendorId)?.name || "Unknown"
          : txn.vendorId.name;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId,
          vendorName,
          totalTransactions: 0,
          totalAmount: 0,
          totalSales: 0,
          totalReturns: 0,
          devicesSold: 0,
          lastTransactionDate: txn.createdAt,
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

    // Use filtered vendors data - only show vendors that have transactions or the selected vendor
    return vendorsData.map((vendor) => {
      const vendorTransactions = transactions.filter((txn) => {
        const vendorId = typeof txn.vendorId === "string" ? txn.vendorId : txn.vendorId?._id;
        return vendorId === vendor._id;
      });
      
      const totalTransactions = vendorTransactions.length;
      const totalSales = vendorTransactions.filter(txn => txn.type === "sell").reduce((sum, txn) => sum + txn.amount, 0);
      const totalReturns = vendorTransactions.filter(txn => txn.type === "return").reduce((sum, txn) => sum + txn.amount, 0);
      const devicesSold = vendorTransactions.filter(txn => txn.type === "sell").length;
      const lastTransaction = vendorTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      return {
        vendorId: vendor._id,
        vendorName: vendor.name,
        totalTransactions,
        totalAmount: totalSales + totalReturns,
        totalSales,
        totalReturns,
        devicesSold,
        lastTransactionDate: lastTransaction?.createdAt || new Date().toISOString(),
      };
    });
  };

  const generateCompanyReports = (devices: any[], companiesData: any[]): CompanyReportData[] => {
    console.log("Companies available:", companiesData);
    console.log("Devices for company calculation:", devices);

    // Use paginated companies data
    const companiesToShow = companiesData;

    const companyReports = companiesToShow.map((company) => {
      // Calculate device statistics for this company
      console.log(`Checking devices for company: ${company.name} (${company._id})`);
      
      const companyDevices = devices.filter((device) => {
        const deviceCompanyIds = device.selectedCompanyIds || device.companyIds;
        
        // Debug: log first few devices to see structure
        if (devices.indexOf(device) < 3) {
          console.log('Device structure:', {
            deviceId: device.deviceId,
            selectedCompanyIds: device.selectedCompanyIds,
            companyIds: device.companyIds
          });
        }
        
        if (!deviceCompanyIds) return false;
        
        // Check if device has this company's _id in its companyIds field
        if (typeof deviceCompanyIds === 'string') {
          return deviceCompanyIds === company._id;
        }
        if (Array.isArray(deviceCompanyIds)) {
          return deviceCompanyIds.includes(company._id);
        }
        return false;
      });
      
      console.log(`Found ${companyDevices.length} devices for company ${company.name}`);

      const soldDevices = companyDevices.filter(
        (device) => device.selling
      ).length;
      const availableDevices = companyDevices.length - soldDevices;
      const totalValue = companyDevices.reduce(
        (sum, device) => sum + (device.cost || 0),
        0
      );

      return {
        companyId: company._id,
        companyName: company.name,
        totalDevices: companyDevices.length,
        soldDevices,
        availableDevices,
        totalValue,
        creditValue: company.creditValue,
        isActive: company.isActive,
        companyIds: company.companyIds || []
      };
    });

    console.log("Final company reports:", companyReports);
    return companyReports;
  };

  const generateEmployeeReports = (devices: any[], employeesData: any[]): EmployeeReportData[] => {
    // Use paginated employees data
    const employeesToShow = employeesData;

    const employeeReports = employeesToShow.map((employee) => {
      // Calculate device statistics for this employee
      const employeeDevices = devices.filter((device) => {
        const pickedBy = device.pickedBy;
        if (typeof pickedBy === 'string') {
          return pickedBy === employee._id;
        }
        if (typeof pickedBy === 'object' && pickedBy?._id) {
          return pickedBy._id === employee._id;
        }
        return false;
      });

      const soldDevices = employeeDevices.filter(
        (device) => device.selling
      ).length;
      const totalSalesValue = employeeDevices.reduce(
        (sum, device) => sum + (device.selling || 0),
        0
      );
      const lastActivity = employeeDevices.length > 0 
        ? employeeDevices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : new Date().toISOString();

      return {
        employeeId: employee._id,
        employeeName: employee.name,
        email: employee.email,
        phone: employee.phone,
        salaryPerDay: employee.salaryPerDay,
        isActive: employee.isActive,
        totalDevicesHandled: employeeDevices.length,
        soldDevices,
        availableDevices: employeeDevices.length - soldDevices,
        totalSalesValue,
        lastActivity,
      };
    });

    return employeeReports;
  };

  // Fetch all data for export (without pagination)
  const fetchAllDataForExport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error("Please select both start and end dates to export data");
      return null;
    }

    try {
      // Build filter params without pagination limits
      const deviceFilters: any = {
        limit: 0, // Get all data
        filter: {},
      };

      const transactionFilters: any = {
        limit: 0, // Get all data
        filter: {},
      };

      // Apply date filters
      if (filters.startDate) {
        deviceFilters.filter.startDate = filters.startDate;
        transactionFilters.filter.startDate = filters.startDate;
      }
      if (filters.endDate) {
        deviceFilters.filter.endDate = filters.endDate;
        transactionFilters.filter.endDate = filters.endDate;
      }

      // Apply specific filters
      if (filters.companyId) {
        deviceFilters.filter.companyIds = filters.companyId;
      }
      if (filters.vendorId) {
        transactionFilters.filter.vendorId = filters.vendorId;
        deviceFilters.filter.vendorId = filters.vendorId;
      }
      if (filters.employeeId) {
        deviceFilters.filter.pickedBy = filters.employeeId;
      }

      // Fetch all data
      const [devicesRes, transactionsRes, vendorsRes, companiesRes, employeesRes] = await Promise.all([
        getAllDevices(deviceFilters),
        getAllTransactions(transactionFilters),
        getAllVendors({ limit: 0 }),
        getAllCompanies({ limit: 0 }),
        getAllEmployees({ limit: 0 }),
      ]);

      const devices = devicesRes.data?.devices || [];
      const transactions = transactionsRes.data?.transactions || [];
      let vendorsData = vendorsRes.data?.vendors || vendorsRes.vendors || vendorsRes.data || [];
      let companiesData = companiesRes.data?.companies || companiesRes.companies || companiesRes.data || [];
      let employeesData = employeesRes.data?.employees || employeesRes.employees || employeesRes.data || [];
      
      // Filter data on frontend if specific items are selected
      if (filters.vendorId) {
        vendorsData = vendorsData.filter((vendor: any) => vendor._id === filters.vendorId);
      }
      if (filters.companyId) {
        companiesData = companiesData.filter((company: any) => company._id === filters.companyId);
      }
      if (filters.employeeId) {
        employeesData = employeesData.filter((employee: any) => employee._id === filters.employeeId);
      }

      // Process data
      const processedDevices: DeviceData[] = devices.map((device: any) => ({
        _id: device._id,
        deviceId: device.deviceId || device._id,
        brand: device.brand || "N/A",
        model: device.model || "N/A",
        imei1: device.imei1 || "N/A",
        imei2: device.imei2,
        initialCost: device.initialCost || device.cost || 0,
        cost: device.cost || 0,
        credit: device.credit || 0,
        selling: device.selling,
        soldTo: device.soldTo,
        pickedBy: device.pickedBy,
        companyIds: device.companyIds,
        selectedCompanyIds: device.selectedCompanyIds,
        sellHistory: device.sellHistory,
        warranty: device.warranty || "N/A",
        issues: device.issues || "N/A",
        createdAt: device.createdAt,
        status: getDeviceStatus(device),
        profit: device.profit,
      }));

      // Filter transactions by vendor if selected
      let filteredTransactions = transactions;
      if (filters.vendorId) {
        filteredTransactions = transactions.filter((txn: any) => {
          const vendorId = typeof txn.vendorId === "string" ? txn.vendorId : txn.vendorId?._id;
          return vendorId === filters.vendorId;
        });
      }

      const processedTransactions: TransactionData[] = filteredTransactions.map((txn: any) => ({
        _id: txn._id,
        type: txn.type,
        amount: txn.amount,
        vendor: txn.vendorId?.name || "N/A",
        device: txn.deviceId?.model || txn.deviceId?.deviceId || "N/A",
        paymentMode: txn.paymentMode || "N/A",
        note: txn.note || "",
        author: txn.author?.authorId?.name || "N/A",
        createdAt: txn.createdAt,
      }));

      // Generate reports
      const vendorReportsData = generateVendorReports(filteredTransactions, devices, vendorsData);
      const companyReportsData = generateCompanyReports(devices, companiesData);
      const employeeReportsData = generateEmployeeReports(devices, employeesData);

      return {
        devices: processedDevices,
        transactions: processedTransactions,
        vendors: vendorReportsData,
        companies: companyReportsData,
        employees: employeeReportsData,
      };
    } catch (error) {
      console.error("Error fetching export data:", error);
      toast.error("Failed to fetch data for export");
      return null;
    }
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportVendorData = async () => {
    const allData = await fetchAllDataForExport();
    if (!allData) return;

    const exportData = allData.vendors.map((vendor, index) => ({
      "SL": index + 1,
      "Vendor Name": vendor.vendorName,
      "Amount": vendors.find(v => v._id === vendor.vendorId)?.amount || 0,
      "Total Transactions": vendor.totalTransactions,
      "Total Returns": vendor.totalReturns,
      "Devices Sold": vendor.devicesSold,
      "Last Transaction": format(new Date(vendor.lastTransactionDate), "dd/MM/yyyy"),
      "Status": vendors.find(v => v._id === vendor.vendorId)?.isActive ? "Active" : "Inactive"
    }));
    exportToExcel(exportData, "vendors_report");
    toast.success(`Exported ${exportData.length} vendor records`);
  };

  const exportCompanyData = async () => {
    const allData = await fetchAllDataForExport();
    if (!allData) return;

    const exportData = allData.companies.map((company, index) => ({
      "SL": index + 1,
      "Name": company.companyName,
      "Credit Value": company.creditValue || 0,
      "Company Ids": Array.isArray(company.companyIds) ? company.companyIds.join(", ") : company.companyIds || "N/A",
      "Status": company.isActive ? "Active" : "Inactive"
    }));
    exportToExcel(exportData, "companies_report");
    toast.success(`Exported ${exportData.length} company records`);
  };

  const exportEmployeeData = async () => {
    const allData = await fetchAllDataForExport();
    if (!allData) return;

    const exportData = allData.employees.map((employee, index) => ({
      "SL": index + 1,
      "Name": employee.employeeName,
      "Email": employee.email,
      "Phone": employee.phone,
      "Salary/Day": employee.salaryPerDay,
      "Active": employee.isActive ? "Active" : "Inactive"
    }));
    exportToExcel(exportData, "employees_report");
    toast.success(`Exported ${exportData.length} employee records`);
  };

  const exportDeviceData = async () => {
    const allData = await fetchAllDataForExport();
    if (!allData) return;

    const exportData = allData.devices.map((device, index) => {
      const sellHistory = device.sellHistory;
      const lastSell = sellHistory?.find((h) => h.type === "sell");
      const company = device.companyIds as any;
      const pickedBy = device.pickedBy as any;
      const returnCount = sellHistory?.filter((h: any) => h.type === "return").length || 0;
      const profit = device.profit;
      
      return {
        "SL": index + 1,
        "Device ID": device.deviceId,
        "Company ID": device.selectedCompanyIds,
        "Brand": device.brand,
        "Model": device.model,
        "Sold To": lastSell?.vendor?.name || "-",
        "Company": company?.name || company || "-",
        "Picked By": pickedBy?.name || pickedBy || "-",
        "Selling Amount": lastSell?.selling || lastSell?.amount || "-",
        "Profit/Loss": profit !== undefined && profit !== null ? (profit >= 0 ? `+${profit}` : profit) : "-",
        "Return Count": returnCount
      };
    });
    exportToExcel(exportData, "devices_report");
    toast.success(`Exported ${exportData.length} device records`);
  };

  const exportTransactionData = async () => {
    const allData = await fetchAllDataForExport();
    if (!allData) return;

    const exportData = allData.transactions.map((transaction, index) => ({
      "SL": index + 1,
      "Type": transaction.type,
      "Amount": `₹${transaction.amount}`,
      "Vendor": transaction.vendor,
      "Device": transaction.device,
      "Payment Mode": transaction.paymentMode,
      "Note": transaction.note || "N/A",
      "Author": transaction.author,
      "Date": format(new Date(transaction.createdAt), "dd/MM/yyyy")
    }));
    exportToExcel(exportData, "transactions_report");
    toast.success(`Exported ${exportData.length} transaction records`);
  };

  // Column definitions
  const deviceColumns: ColumnDef<DeviceData>[] = [
    {
      accessorKey: "_id",
      header: "SL",
      cell: ({ row }) => (devicePage - 1) * 10 + row.index + 1,
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
      header: "Sold To",
      cell: ({ row }) => {
        const sellHistory = row.original.sellHistory;
        const lastSell = sellHistory?.find((h) => h.type === "sell");
        return lastSell?.vendor?.name || "-";
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
      accessorKey: "sellHistory",
      header: "Selling Amount",
      cell: ({ row }: { row: any }) => {
        const sellHistory = row.original.sellHistory;
        const lastSell = sellHistory?.find((h: any) => h.type === "sell");
        return lastSell?.selling || lastSell?.amount || "-";
      },
    },
    {
      accessorKey: "profit",
      header: "Profit/Loss",
      cell: ({ row }: { row: any }) => {
        const profit = row.original.profit;
        if (profit === undefined || profit === null) return "-";
        const isProfit = profit >= 0;
        return (
          <span
            className={
              isProfit
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {isProfit ? "+" : ""}
            {profit}
          </span>
        );
      },
    },
    {
      accessorKey: "sellHistory",
      header: "Return Count",
      cell: ({ row }) => {
        const sellHistory = row.original.sellHistory;
        const returnCount =
          sellHistory?.filter((h: any) => h.type === "return").length || 0;
        return (
          <span
            className={
              returnCount > 3 ? "text-red-600 font-bold" : "text-gray-900"
            }
          >
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
        </div>
      ),
    },
  ];

  const transactionColumns: ColumnDef<TransactionData>[] = [
    {
      accessorKey: "_id",
      header: "SL",
      cell: ({ row }) => (transactionPage - 1) * 10 + row.index + 1,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const variant =
          type === "sell"
            ? "default"
            : type === "return"
              ? "destructive"
              : "secondary";
        return <Badge variant={variant}>{type}</Badge>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₹${row.getValue("amount")}`,
    },
    { accessorKey: "vendor", header: "Vendor" },
    { accessorKey: "device", header: "Device" },
    { accessorKey: "paymentMode", header: "Payment Mode" },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ row }) => {
        const note = row.getValue("note") as string;
        return note || "N/A";
      },
    },
    { accessorKey: "author", header: "Author" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) =>
        format(new Date(row.getValue("createdAt")), "dd/MM/yyyy"),
    },
  ];

  const vendorColumns: ColumnDef<VendorReportData>[] = [
    {
      accessorKey: "vendorId",
      header: "SL",
      cell: ({ row }) => (vendorPage - 1) * 10 + row.index + 1,
    },
    {
      accessorKey: "vendorName",
      header: "Vendor Name",
      cell: ({ row }) => {
        const vendorName = row.getValue("vendorName") as string;
        return <div className="font-medium">{vendorName}</div>;
      },
    },
    {
      accessorKey: "vendorAmount",
      header: "Amount",
      cell: ({ row }) => {
        const vendorId = row.original.vendorId;
        const vendor = vendors.find((v) => v._id === vendorId);
        return `₹${vendor?.amount || 0}`;
      },
    },
    {
      accessorKey: "totalTransactions",
      header: "Total Transactions",
      cell: ({ row }) => {
        const count = row.getValue("totalTransactions") as number;
        return <Badge variant="outline">{count}</Badge>;
      },
    },
    {
      accessorKey: "totalReturns",
      header: "Total Returns",
      cell: ({ row }) => {
        const returns = row.getValue("totalReturns") as number;
        return <span className="font-medium text-red-600">₹{returns}</span>;
      },
    },
    {
      accessorKey: "devicesSold",
      header: "Devices Sold",
      cell: ({ row }) => {
        const count = row.getValue("devicesSold") as number;
        return <Badge variant="secondary">{count}</Badge>;
      },
    },
    {
      accessorKey: "lastTransactionDate",
      header: "Last Transaction",
      cell: ({ row }) => {
        const date = row.getValue("lastTransactionDate") as string;
        return format(new Date(date), "dd/MM/yyyy");
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const vendorId = row.original.vendorId;
        const vendor = vendors.find((v) => v._id === vendorId);
        return (
          <Badge variant={vendor?.isActive ? "default" : "secondary"}>
            {vendor?.isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="outline"
          onClick={() => router.push(`/vendor/${row.original.vendorId}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const companyColumns: ColumnDef<CompanyReportData>[] = [
    {
      accessorKey: "companyId",
      header: "SL",
      cell: ({ row }) => (companyPage - 1) * 10 + row.index + 1,
    },
    {
      accessorKey: "companyName",
      header: "Name",
      cell: ({ row }) => {
        const companyName = row.getValue("companyName") as string;
        return <div className="font-medium">{companyName}</div>;
      },
    },
    {
      accessorKey: "creditValue",
      header: "Credit Value",
      cell: ({ row }) => {
        const creditValue = row.original.creditValue;
        return `₹${creditValue || 0}`;
      },
    },
    {
      accessorKey: "companyIds",
      header: "Company Ids",
      cell: ({ row }) => {
        const companyIds = row.original.companyIds;
        if (Array.isArray(companyIds)) {
          return companyIds.join(", ");
        }
        return companyIds || "N/A";
      },
    },

    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
  ];

  const employeeColumns: ColumnDef<EmployeeReportData>[] = [
    {
      accessorKey: "employeeId",
      header: "SL",
      cell: ({ row }) => (employeePage - 1) * 10 + row.index + 1,
    },
    {
      accessorKey: "employeeName",
      header: "Name",
      cell: ({ row }) => {
        const employeeName = row.getValue("employeeName") as string;
        return <div className="font-medium">{employeeName}</div>;
      },
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
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="outline"
          onClick={() => router.push(`/employee/${row.original.employeeId}/devices`)}
          title="View Devices"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // Prepare options for searchable selects
  const vendorOptions: SearchableSelectOption[] = [
    { value: "", label: "All Vendors" },
    ...vendors.map((vendor) => ({ value: vendor._id, label: vendor.name })),
  ];

  const companyOptions: SearchableSelectOption[] = [
    { value: "", label: "All Companies" },
    ...companies.map((company) => ({
      value: company._id,
      label: company.name,
    })),
  ];

  const employeeOptions: SearchableSelectOption[] = [
    { value: "", label: "All Employees" },
    ...employees.map((employee) => ({
      value: employee._id,
      label: employee.name,
    })),
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Dashboard</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports for your business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
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
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Vendor</label>
              <SearchableSelect
                options={vendorOptions}
                value={filters.vendorId || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    vendorId: value || undefined,
                  }))
                }
                placeholder="Select vendor..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Company</label>
              <SearchableSelect
                options={companyOptions}
                value={filters.companyId || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    companyId: value || undefined,
                  }))
                }
                placeholder="Select company..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Employee</label>
              <SearchableSelect
                options={employeeOptions}
                value={filters.employeeId || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    employeeId: value || undefined,
                  }))
                }
                placeholder="Select employee..."
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              {hasActiveFilters() && (
                <Button variant="outline" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchReportsData} 
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Reports"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Device Reports ({deviceData.length} devices)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportDeviceData}
                disabled={deviceData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={deviceColumns}
                data={deviceData}
                pagination={{
                  currentPage: devicePage,
                  ...devicePagination,
                }}
                onPaginationChange={handleDevicePageChange}
                loading={loading}
                getRowClassName={(device: DeviceData) => {
                  const returnCount =
                    device.sellHistory?.filter((h: any) => h.type === "return")
                      .length || 0;
                  return returnCount > 3 ? "bg-red-50 border-red-200" : "";
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Transaction Reports ({transactionData.length} transactions)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTransactionData}
                disabled={transactionData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={transactionData}
                pagination={{
                  currentPage: transactionPage,
                  ...transactionPagination,
                }}
                onPaginationChange={handleTransactionPageChange}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Vendor Reports ({vendorReports.length} vendors)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportVendorData}
                disabled={vendorReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={vendorColumns}
                data={vendorReports}
                pagination={{
                  currentPage: vendorPage,
                  ...vendorPagination,
                }}
                onPaginationChange={handleVendorPageChange}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Company Reports ({companyReports.length} companies)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCompanyData}
                disabled={companyReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={companyColumns}
                data={companyReports}
                pagination={{
                  currentPage: companyPage,
                  ...companyPagination,
                }}
                onPaginationChange={handleCompanyPageChange}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Employee Reports ({employeeReports.length} employees)
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportEmployeeData}
                disabled={employeeReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={employeeColumns}
                data={employeeReports}
                pagination={{
                  currentPage: employeePage,
                  ...employeePagination,
                }}
                onPaginationChange={handleEmployeePageChange}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
