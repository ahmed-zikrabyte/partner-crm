/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, Wallet, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { getPartnerProfile, getEmployeeProfile } from "@/services/authService";
import { toast } from "sonner";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cashAmount?: number;
  salaryPerDay?: number;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    setUserType(storedUserType);
    fetchProfile(storedUserType);
  }, []);

  const fetchProfile = async (userType: string | null) => {
    try {
      const response = userType === "partner" 
        ? await getPartnerProfile()
        : await getEmployeeProfile();
      setProfile(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center text-red-500">Failed to load profile</div>;
  }

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                <p className="font-semibold">{profile.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-semibold">{profile.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="font-semibold">{profile.phone}</p>
              </div>
            </div>
            
            {userType === "partner" && profile.cashAmount !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 uppercase tracking-wide">Cash Amount</p>
                  <p className="font-semibold text-green-700">₹{profile.cashAmount.toFixed(2)}</p>
                </div>
              </div>
            )}
            
            {userType === "employee" && profile.salaryPerDay !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 uppercase tracking-wide">Salary Per Day</p>
                  <p className="font-semibold text-blue-700">₹{profile.salaryPerDay.toFixed(2)}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                <p className="font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}