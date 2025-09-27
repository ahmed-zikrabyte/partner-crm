/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, IndianRupee } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  getDeviceById,
  getEmployeesForPartner,
} from "@/services/deviceService";
import { getAllVendors } from "@/services/vendorService";
import { getAllCompanies } from "@/services/companyService";
import type { DeviceData } from "@/components/device/device.schema";
import { AddTransactionDialog } from "@/components/shared/add-transaction-dialog";
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/device")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Device Details</h1>
        {device.vendorId && (
          <Button onClick={() => setTransactionDialogOpen(true)} className="ml-auto">
            <IndianRupee className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Device ID
              </label>
              <p className="capitalize text-lg">{device.deviceId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Service Number
              </label>
              <p className="capitalize text-lg">{device.serviceNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Brand</label>
              <p className="capitalize text-lg">{device.brand}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Model</label>
              <p className="capitalize text-lg">{device.model}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <div>
                <Badge variant={device.isActive ? "default" : "secondary"}>
                  {device.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="capitalize text-sm font-medium text-gray-500">
                IMEI 1
              </label>
              <p className="capitalize text-lg">{device.imei1}</p>
            </div>
            <div>
              <label className="capitalize text-sm font-medium text-gray-500">
                IMEI 2
              </label>
              <p className="capitalize text-lg">{device.imei2 || "-"}</p>
            </div>
            <div>
              <label className="capitalize text-sm font-medium text-gray-500">
                Box
              </label>
              <p className="capitalize text-lg">{device.box || "-"}</p>
            </div>
            <div>
              <label className="capitalize text-sm font-medium text-gray-500">
                Warranty
              </label>
              <p className="capitalize text-lg">{device.warranty || "-"}</p>
            </div>
            <div>
              <label className="capitalize text-sm font-medium text-gray-500">
                Date
              </label>
              <p className="capitalize text-lg">
                {device.date ? new Date(device.date).toLocaleDateString() : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Company
              </label>
              <p className="capitalize text-lg">
                {device.companyIds
                  ? getCompanyName(device.companyIds as string)
                  : "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Picked By
              </label>
              <p className="capitalize text-lg">
                {device.pickedBy
                  ? getEmployeeName(device.pickedBy as string)
                  : "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Selected Company IDs
              </label>
              <p className="capitalize text-lg">
                {device.selectedCompanyIds || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Sold To
              </label>
              <p className="capitalize text-lg">
                {device.vendorId
                  ? getVendorName(device.vendorId as string)
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Initial Cost
              </label>
              <p className="capitalize text-lg">₹{device.initialCost}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Cost</label>
              <p className="capitalize text-lg">₹{device.cost}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Extra Amount
              </label>
              <p className="capitalize text-lg">₹{device.extraAmount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Credit
              </label>
              <p className="capitalize text-lg">{device.credit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Per Credit
              </label>
              <p className="capitalize text-lg">₹{device.perCredit}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Commission
              </label>
              <p className="capitalize text-lg">₹{device.commission}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">GST</label>
              <p className="capitalize text-lg">₹{device.gst}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Total Cost
              </label>
              <p className="capitalize text-lg font-semibold">
                ₹{device.totalCost}
              </p>
            </div>
            {device.selling && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Selling Price
                </label>
                <p className="capitalize text-lg">₹{device.selling}</p>
              </div>
            )}
            {device.profit !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Profit/Loss
                </label>
                <p
                  className={`text-lg ${device.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ₹{device.profit}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {device.issues && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{device.issues}</p>
            </CardContent>
          </Card>
        )}
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
