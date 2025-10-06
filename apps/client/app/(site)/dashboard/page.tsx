"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboardService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Building2,
  Users,
  Smartphone,
  Receipt,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  Award,
} from "lucide-react";

interface DashboardStats {
  counts: {
    companies: number;
    vendors: number;
    employees: number;
    devices: number;
    transactions: number;
  };
  mostUsed: {
    company: { name: string; count: number } | null;
    vendor: { name: string; count: number } | null;
    employee: { name: string; count: number } | null;
  };
  deviceStats: {
    totalDevices: number;
    soldDevices: number;
    returnedDevices: number;
    totalProfit: number;
  };
  paymentModes: {
    received: {
      cash: number;
      upi: number;
      card: number;
    };
    returned: {
      cash: number;
      upi: number;
      card: number;
    };
  };
  financial: {
    totalInvestment: number;
    totalSales: number;
    totalReturns: number;
    totalCredit: number;
    totalDebit: number;
    currentCash: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );

  if (!stats)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Failed to load dashboard</div>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="w-full bg-white shadow-md rounded-md px-4 md:px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-600 mt-1">Real-time business analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white shadow-md rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.companies}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.vendors}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.employees}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.devices}</p>
              </div>
              <Smartphone className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md rounded-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.counts.transactions}</p>
              </div>
              <Receipt className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Analytics */}
      <Card className="bg-white shadow-md rounded-md">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <div className="text-2xl font-bold text-gray-900">{stats.deviceStats.totalDevices}</div>
              <div className="text-sm text-gray-600 mt-1">Total Devices</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">{stats.deviceStats.soldDevices}</div>
              <div className="text-sm text-gray-600 mt-1">Sold Devices</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-md">
              <div className="text-2xl font-bold text-red-600">{stats.deviceStats.returnedDevices}</div>
              <div className="text-sm text-gray-600 mt-1">Returned Devices</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-md">
              <div className="text-2xl font-bold text-blue-600">₹{stats.deviceStats.totalProfit?.toLocaleString() || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Total Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white shadow-md rounded-md">
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Current Cash Balance */}
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Current Cash Balance</span>
                </div>
                <span className="text-xl font-bold text-green-700">₹{stats.financial.currentCash.toLocaleString()}</span>
              </div>
              
              {/* Revenue Sources */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Revenue Sources</h4>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Investment Received</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">₹{stats.financial.totalInvestment.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Internal Adjustments */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">Internal Transactions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">Credit</div>
                    <div className="font-bold">₹{stats.financial.totalCredit.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">Debit</div>
                    <div className="font-bold">₹{stats.financial.totalDebit.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md rounded-md">
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Money Received */}
              <div className="space-y-2">
                <h4 className="font-medium text-green-700 text-sm uppercase tracking-wide">Money Received</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <Banknote className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Cash</div>
                    <div className="font-bold text-green-600">₹{stats.paymentModes.received.cash.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <Smartphone className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">UPI</div>
                    <div className="font-bold text-blue-600">₹{stats.paymentModes.received.upi.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-md">
                    <CreditCard className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Card</div>
                    <div className="font-bold text-purple-600">₹{stats.paymentModes.received.card.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              {/* Money Returned */}
              <div className="space-y-2">
                <h4 className="font-medium text-red-700 text-sm uppercase tracking-wide">Money Returned</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-red-50 rounded-md">
                    <Banknote className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Cash</div>
                    <div className="font-bold text-red-600">₹{stats.paymentModes.returned.cash.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-md">
                    <Smartphone className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">UPI</div>
                    <div className="font-bold text-red-600">₹{stats.paymentModes.returned.upi.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-md">
                    <CreditCard className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Card</div>
                    <div className="font-bold text-red-600">₹{stats.paymentModes.returned.card.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              {/* Net Totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-md">
                  <span className="font-medium text-green-700">Total Received</span>
                  <span className="font-bold text-green-700">
                    ₹{(stats.paymentModes.received.cash + stats.paymentModes.received.upi + stats.paymentModes.received.card).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-md">
                  <span className="font-medium text-red-700">Total Returned</span>
                  <span className="font-bold text-red-700">
                    ₹{(stats.paymentModes.returned.cash + stats.paymentModes.returned.upi + stats.paymentModes.returned.card).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="bg-white shadow-md rounded-md">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">Most Used Company</h3>
              {stats.mostUsed.company ? (
                <div>
                  <div className="text-lg font-bold text-blue-800">{stats.mostUsed.company.name}</div>
                  <div className="text-sm text-blue-600">{stats.mostUsed.company.count} devices assigned</div>
                </div>
              ) : (
                <div className="text-blue-600">No data available</div>
              )}
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-md">
              <h3 className="font-semibold text-green-900 mb-2">Most Active Vendor</h3>
              {stats.mostUsed.vendor ? (
                <div>
                  <div className="text-lg font-bold text-green-800">{stats.mostUsed.vendor.name}</div>
                  <div className="text-sm text-green-600">{stats.mostUsed.vendor.count} transactions</div>
                </div>
              ) : (
                <div className="text-green-600">No data available</div>
              )}
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-md">
              <h3 className="font-semibold text-purple-900 mb-2">Most Active Employee</h3>
              {stats.mostUsed.employee ? (
                <div>
                  <div className="text-lg font-bold text-purple-800">{stats.mostUsed.employee.name}</div>
                  <div className="text-sm text-purple-600">{stats.mostUsed.employee.count} devices handled</div>
                </div>
              ) : (
                <div className="text-purple-600">No data available</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}