/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  IndianRupee,
  Download,
  QrCode,
  Printer,
} from "lucide-react";
import { QRCodeComponent } from "@workspace/ui/components/qr-code";
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

  const createQRCanvas = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;

    const downloadCanvas = document.createElement("canvas");
    const ctx = downloadCanvas.getContext("2d");

    if (ctx) {
      const selectedCompanyIds = device.selectedCompanyIds || "N/A";
      const model = device.model || "N/A";

      // Set exact dimensions for 1" x 1.5" at 300 DPI
      const DPI = 300;
      downloadCanvas.width = DPI; // 1 inch = 300px at 300 DPI
      downloadCanvas.height = DPI * 1.5; // 1.5 inches = 450px at 300 DPI

      // Fill white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // Scale everything proportionally
      const padding = 20;
      const fontSize = 30; // Larger for 300 DPI
      const lineHeight = 35;

      // Company ID at top
      ctx.fillStyle = "black";
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        selectedCompanyIds,
        downloadCanvas.width / 2,
        padding + fontSize
      );

      // Calculate QR size to fit properly
      const availableHeight =
        downloadCanvas.height - padding * 2 - fontSize - 80;
      const qrSize = Math.min(
        downloadCanvas.width - padding * 2,
        availableHeight
      );
      const qrX = (downloadCanvas.width - qrSize) / 2;
      const qrY = padding + fontSize + 15;

      // Draw QR code
      ctx.drawImage(canvas, qrX, qrY, qrSize, qrSize);

      // Model text at bottom
      ctx.font = `bold ${fontSize}px Arial`;
      const maxWidth = downloadCanvas.width - padding * 2;
      const words = model.split(" ");
      let line = "";
      let y = qrY + qrSize + 40;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, downloadCanvas.width / 2, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, downloadCanvas.width / 2, y);

      return downloadCanvas;
    }
    return null;
  };

  const downloadQRCode = () => {
    const downloadCanvas = createQRCanvas();
    if (downloadCanvas) {
      const selectedCompanyIds = device.selectedCompanyIds || "device";
      const link = document.createElement("a");
      link.href = downloadCanvas.toDataURL();
      link.download = `${selectedCompanyIds}-${device.model}-qr.png`;
      link.click();
    }
  };

  const printQRCode = () => {
    const downloadCanvas = createQRCanvas();
    if (!downloadCanvas) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const imageData = downloadCanvas.toDataURL("image/png");

      printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${device.selectedCompanyIds || "Device"}</title>
          <style>
            @page { 
              size: 1in 1.5in;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              width: 1in;
              height: 1.5in;
              margin: 0;
              padding: 0;
              background: white;
            }
            img {
              width: 1in;
              height: 1.5in;
              display: block;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${imageData}" alt="QR Code" />
          <script>
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 250);
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <QrCode className="w-4 h-4 mr-2" />
                    View QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Device QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-4 p-4">
                    <div
                      id="qr-print-section"
                      className="bg-white p-1 rounded-lg shadow-inner border-2 border-gray-100"
                    >
                      <h3 className="text-center font-semibold text-xs">
                        {device.selectedCompanyIds || "N/A"}
                      </h3>
                      <div className="flex justify-center">
                        <QRCodeComponent
                          value={`${process.env.NEXT_PUBLIC_CLIENT_URL || window.location.origin}/qr/device/${device._id}`}
                          size={100}
                        />
                      </div>
                      <p className="text-center text-xs font-semibold break-words max-w-[100px] mx-auto leading-tight">
                        {device.model || "N/A"}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-gray-600">
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
                      <Button
                        onClick={printQRCode}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {device.sellHistory && device.sellHistory.length > 0 && (
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
                        Current Status
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {(() => {
                          if (
                            !device.sellHistory ||
                            device.sellHistory.length === 0
                          )
                            return "New";
                          const lastEntry =
                            device.sellHistory[device.sellHistory.length - 1];
                          if (!lastEntry) return "New";
                          return lastEntry.type === "sell"
                            ? "Sold"
                            : "Returned";
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Latest Vendor
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                        {(() => {
                          if (
                            !device.sellHistory ||
                            device.sellHistory.length === 0
                          )
                            return "-";
                          const lastEntry =
                            device.sellHistory[device.sellHistory.length - 1];
                          if (!lastEntry) return "-";
                          const vendorId =
                            typeof lastEntry.vendor === "object"
                              ? lastEntry.vendor._id
                              : lastEntry.vendor;
                          return getVendorName(vendorId);
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Return Count
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {device.sellHistory?.filter((h) => h.type === "return")
                          .length || 0}
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
                  {(() => {
                    if (!device.sellHistory || device.sellHistory.length === 0)
                      return null;
                    const lastEntry =
                      device.sellHistory[device.sellHistory.length - 1];
                    if (!lastEntry) return null;
                    const amount =
                      lastEntry.selling ||
                      lastEntry.returnAmount ||
                      lastEntry.amount;
                    if (!amount) return null;

                    return (
                      <div
                        className={`p-3 rounded-lg ${
                          lastEntry.type === "sell"
                            ? "bg-emerald-50"
                            : "bg-red-50"
                        }`}
                      >
                        <label
                          className={`text-xs font-medium uppercase tracking-wide ${
                            lastEntry.type === "sell"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {lastEntry.type === "sell"
                            ? "Latest Selling Price"
                            : "Latest Return Amount"}
                        </label>
                        <p
                          className={`text-lg font-semibold mt-1 ${
                            lastEntry.type === "sell"
                              ? "text-emerald-900"
                              : "text-red-900"
                          }`}
                        >
                          ₹{amount}
                        </p>
                      </div>
                    );
                  })()}
                  {(() => {
                    // Calculate profit using backend logic: (total sells - total returns) - total cost
                    let effectiveSelling = 0;
                    if (device.sellHistory && device.sellHistory.length > 0) {
                      for (const h of device.sellHistory) {
                        if (h.type === "sell" && (h.selling || h.amount)) {
                          effectiveSelling += h.selling || h.amount || 0;
                        } else if (h.type === "return" && (h.returnAmount || h.amount)) {
                          effectiveSelling -= h.returnAmount || h.amount || 0;
                        }
                      }
                    }
                    const calculatedProfit = effectiveSelling - device.totalCost;
                    
                    return (
                      <div className={`p-3 rounded-lg ${calculatedProfit >= 0 ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"}`}>
                        <label className={`text-xs font-medium uppercase tracking-wide ${calculatedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          Profit/Loss
                        </label>
                        <p className={`text-xl font-bold mt-1 ${calculatedProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                          ₹{calculatedProfit}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {device.sellHistory && device.sellHistory.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {device.sellHistory.map((transaction, index) => {
                      const transactionAmount = transaction.selling || transaction.returnAmount || transaction.amount || 0;
                      
                      let financialDetail = null;
                      let financialLabel = "";
                      
                      if (transaction.type === "sell") {
                        // For sells: calculate cumulative profit up to this point
                        let cumulativeSelling = 0;
                        for (let i = 0; i <= index; i++) {
                          const h = device.sellHistory?.[i];
                          if (h && h.type === "sell" && (h.selling || h.amount)) {
                            cumulativeSelling += h.selling || h.amount || 0;
                          } else if (h && h.type === "return" && (h.returnAmount || h.amount)) {
                            cumulativeSelling -= h.returnAmount || h.amount || 0;
                          }
                        }
                        financialDetail = cumulativeSelling - device.totalCost;
                        financialLabel = "Cumulative P/L";
                      } else if (transaction.type === "return") {
                        // For returns: show previous sell amount - return amount
                        const previousSells = device.sellHistory?.slice(0, index).filter(t => t.type === "sell") || [];
                        if (previousSells.length > 0) {
                          const lastSell = previousSells[previousSells.length - 1];
                          if (lastSell) {
                            const lastSellAmount = lastSell.selling || lastSell.amount || 0;
                            financialDetail = lastSellAmount - transactionAmount;
                            financialLabel = "Surplus";
                          }
                        }
                      }
                      
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            transaction.type === "sell"
                              ? "bg-green-50 border-green-400"
                              : "bg-red-50 border-red-400"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={
                                    transaction.type === "sell"
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {transaction.type === "sell"
                                    ? "SOLD"
                                    : "RETURNED"}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    transaction.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">
                                {transaction.type === "sell"
                                  ? "Sold to"
                                  : "Returned from"}
                                :{" "}
                                {getVendorName(
                                  typeof transaction.vendor === "object"
                                    ? transaction.vendor._id
                                    : transaction.vendor
                                )}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p
                                className={`text-lg font-bold ${
                                  transaction.type === "sell"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                ₹{transactionAmount}
                              </p>
                              {financialDetail !== null && (
                                <div className={`text-sm font-medium px-2 py-1 rounded ${
                                  financialDetail >= 0 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {financialLabel}: {financialDetail >= 0 ? "+" : ""}₹{financialDetail}
                                  {transaction.type === "return" && financialDetail < 0 && " (Surplus)"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

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

      {device.sellHistory && device.sellHistory.length > 0 && (
        <AddTransactionDialog
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
          entityId={(() => {
            const lastEntry = device.sellHistory[device.sellHistory.length - 1];
            if (!lastEntry) return "";
            return typeof lastEntry.vendor === "object"
              ? lastEntry.vendor._id
              : lastEntry.vendor || "";
          })()}
          entityType="vendor"
          deviceContext={{
            deviceId: device._id,
            sellHistory: device.sellHistory
          }}
          onSuccess={() => {
            toast.success("Transaction recorded for vendor");
          }}
        />
      )}
    </div>
  );
}
