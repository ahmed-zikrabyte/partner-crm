/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function QRDeviceRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Try to access the protected device endpoint
        await axiosInstance.get(`/partner/devices/${params.id}`);
        // If successful, user is authenticated - redirect to individual device page
        router.replace(`/device/${params.id}`);
      } catch (error: any) {
        // If 405 or any auth error, redirect to public page
        if (error?.response?.status === 405 || error?.response?.status === 401 || error?.response?.status === 403) {
          router.replace(`/public/device/${params.id}`);
        } else {
          router.replace(`/public/device/${params.id}`);
        }
      }
    };

    if (params.id) {
      checkAuthAndRedirect();
    }
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Redirecting to device details...</p>
      </div>
    </div>
  );
}