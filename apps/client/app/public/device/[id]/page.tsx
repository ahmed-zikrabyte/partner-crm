"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import axios from "axios";

interface DeviceData {
  _id: string;
  deviceId: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  serviceNumber: string;
  box?: string;
  warranty?: string;
  issues?: string;
  cost: number;
  totalCost: number;
  selling?: number;
  date: string;
  isActive: boolean;
  companyIds?: { name: string };
  vendorId?: { name: string };
  pickedBy?: { name: string };
}

export default function PublicDeviceDetailsPage() {
  const params = useParams();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/device/${params.id}`;
        console.log('Fetching device from:', url);
        const response = await axios.get(url);
        console.log('Response:', response.data);
        setDevice(response.data.data);
      } catch (err: any) {
        console.error('Error fetching device:', err.response?.data || err.message);
        setError("Device not found or unavailable");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDevice();
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Loading device details...</div>;
  }

  if (error || !device) {
    return (
      <div className="p-6 text-red-600">{error || "Device not found"}</div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Device Details</h1>
        <p className="text-gray-600 mt-2">Scanned from QR Code</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Device ID
              </label>
              <p className="text-lg">{device.deviceId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Brand</label>
              <p className="text-lg">{device.brand}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Model</label>
              <p className="text-lg">{device.model}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                IMEI 1
              </label>
              <p className="text-lg">{device.imei1}</p>
            </div>
            {device.imei2 && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  IMEI 2
                </label>
                <p className="text-lg">{device.imei2}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">
                Service Number
              </label>
              <p className="text-lg">{device.serviceNumber}</p>
            </div>
            {device.box && (
              <div>
                <label className="text-sm font-medium text-gray-500">Box</label>
                <p className="text-lg">{device.box}</p>
              </div>
            )}
            {device.warranty && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Warranty
                </label>
                <p className="text-lg">{device.warranty}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {device.issues && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{device.issues}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
