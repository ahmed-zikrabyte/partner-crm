"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import DeviceForm from "@/components/device/device.form";
import { toast } from "sonner";

export default function CreateDevicePage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success("Device created successfully");
    router.push("/device");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Device</h1>
              <p className="text-base text-gray-500 mt-1">
                Add a new device to the system
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <DeviceForm
            mode="create"
            onSuccess={handleSuccess}
            onCancel={() => router.push("/device")}
          />
        </div>
      </div>
    </div>
  );
}