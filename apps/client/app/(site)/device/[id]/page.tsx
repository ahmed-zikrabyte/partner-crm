/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, IndianRupee, Download, Share2, QrCode } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  getDeviceById,
  getEmployeesForPartner,
} from "@/services/deviceService";
import { getAllVendors } from "@/services/vendorService";
import { getAllCompanies } from "@/services/companyService";
import type { DeviceData } from "@/components/device/device.schema";
import { AddTransactionDialog } from "@/components/global/add-transaction-dialog";
import { toast } from "sonner";

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceRes, vendorsRes, companiesRes, employeesRes] =
          await Promise.all([
            getDeviceById(params.id as string),
            getAllVendors({ limit: 0 }),
            getAllCompanies({ limit: 0 }),
            getEmployeesForPartner(),
          ]);
        setDevice(deviceRes.data);
        setVendors(vendorsRes.data.vendors || []);
        setCompanies(companiesRes.data.companies || []);
        setEmployees(employeesRes.data || []);
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Failed to fetch device details"
        );
        router.push("/device");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!device) {
    return <div className="p-6">Device not found</div>;
  }

  const getCompanyName = (id: string) => {
    const company = companies.find((c) => c._id === id);
    return company?.name || id;
  };

  const getVendorName = (id: string) => {
    const vendor = vendors.find((v) => v._id === id);
    return vendor?.name || id;
  };

  const getEmployeeName = (id: string) => {
    const employee = employees.find((e) => e._id === id);
    return employee?.name || id;
  };

  const downloadQRCode = () => {
    if (device.qrCodeUrl) {
      const link = document.createElement("a");
      link.href = device.qrCodeUrl;
      link.download = `device-${device.deviceId}-qr.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/device")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Device Details
                </h1>
                <p className="text-base text-gray-500 mt-1">
                  ID: {device.deviceId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {device.qrCodeUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Device QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4 p-4">
                      <div className="bg-white p-4 rounded-lg shadow-inner border-2 border-gray-100">
                        <img
                          src={device.qrCodeUrl}
                          alt="Device QR Code"
                          className="w-64 h-64 object-contain"
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          Scan to view device details
                        </p>
                        <p className="text-xs text-gray-500">
                          Device ID: {device.deviceId}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          onClick={downloadQRCode}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {device.vendorId && (
                <Button onClick={() => setTransactionDialogOpen(true)}>
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Device Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Device ID
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {device.deviceId}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Service Number
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {device.serviceNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Brand
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {device.brand}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Model
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {device.model}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        IMEI 1
                      </label>
                      <p className="capitalize text-base text-gray-900 mt-1 bg-gray-50 px-2 py-1 rounded">
                        {device.imei1}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        IMEI 2
                      </label>
                      <p className="capitalize text-base text-gray-900 mt-1 bg-gray-50 px-2 py-1 rounded">
                        {device.imei2 || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Box
                      </label>
                      <p className="capitalize text-base font-semibold text-gray-900 mt-1">
                        {device.box || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Warranty
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {device.warranty || "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Assignment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Company
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {device.companyIds
                          ? getCompanyName(device.companyIds as string)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Picked By
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {device.pickedBy
                          ? getEmployeeName(device.pickedBy as string)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Picked Date
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {device.date
                          ? new Date(device.date).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Selected Company IDs
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {device.selectedCompanyIds || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Sold To
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {device.vendorId
                          ? getVendorName(device.vendorId as string)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-sm">
              <CardHeader className="">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      Initial Cost
                    </label>
                    <p className="text-lg font-semibold text-blue-900 mt-1">
                      ₹{device.initialCost}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Purchased Cost
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      ₹{device.cost}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                      Extra Amount
                    </label>
                    <p className="text-lg font-semibold text-orange-900 mt-1">
                      ₹{device.extraAmount}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                      Credits
                    </label>
                    <p className="text-lg font-semibold text-purple-900 mt-1">
                      {device.credit}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                      Per Credit Value
                    </label>
                    <p className="text-lg font-semibold text-indigo-900 mt-1">
                      ₹{device.perCredit}
                    </p>
                  </div>
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-pink-600 uppercase tracking-wide">
                      Commission
                    </label>
                    <p className="text-lg font-semibold text-pink-900 mt-1">
                      ₹{device.commission}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
                      GST
                    </label>
                    <p className="text-lg font-semibold text-yellow-900 mt-1">
                      ₹{device.gst}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                    <label className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Total Cost
                    </label>
                    <p className="text-xl font-bold text-green-900 mt-1">
                      ₹{device.totalCost}
                    </p>
                  </div>
                  {device.selling && (
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <label className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                        Selling Price
                      </label>
                      <p className="text-lg font-semibold text-emerald-900 mt-1">
                        ₹{device.selling}
                      </p>
                    </div>
                  )}
                  {device.profit !== undefined && (
                    <div
                      className={`p-3 rounded-lg ${device.profit >= 0 ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}
                    >
                      <label
                        className={`text-xs font-medium uppercase tracking-wide ${device.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        Profit/Loss
                      </label>
                      <p
                        className={`text-xl font-bold mt-1 ${device.profit >= 0 ? "text-green-900" : "text-red-900"}`}
                      >
                        ₹{device.profit}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {device.issues && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{device.issues}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {device.vendorId && (
        <AddTransactionDialog
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
          entityId={device.vendorId as string}
          entityType="vendor"
          onSuccess={() => {
            toast.success("Transaction recorded for vendor");
          }}
        />
      )}
    </div>
  );
}
