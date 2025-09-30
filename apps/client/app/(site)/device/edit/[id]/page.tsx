"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import DeviceForm from "@/components/device/device.form";
import { getDeviceById } from "@/services/deviceService";
import type { DeviceData } from "@/components/device/device.schema";
import { toast } from "sonner";

export default function EditDevicePage() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const response = await getDeviceById(params.id as string);
        setDevice(response.data);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to fetch device");
        router.push("/device");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDevice();
    }
  }, [params.id, router]);

  const handleSuccess = () => {
    toast.success("Device updated successfully");
    router.push("/device");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Device not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Device</h1>
              <p className="text-base text-gray-500 mt-1">
                Update device information
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <DeviceForm
            mode="edit"
            deviceId={device._id}
            defaultValues={device}
            onSuccess={handleSuccess}
            onCancel={() => router.push("/device")}
          />
        </div>
      </div>
    </div>
  );
}