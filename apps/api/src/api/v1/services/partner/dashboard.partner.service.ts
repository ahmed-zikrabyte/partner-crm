import mongoose from "mongoose";
import { CompanyModel } from "../../../../models/company.model";
import { VendorModel } from "../../../../models/vendor.model";
import { EmployeeModel } from "../../../../models/employee.model";
import { DeviceModel } from "../../../../models/device.model";
import { TransactionModel } from "../../../../models/transaction.model";
import { PartnerModel } from "../../../../models/partner.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import type { ServiceResponse } from "../../../../typings";

export default class DashboardService {
  async getDashboardStats(partnerId: string): Promise<ServiceResponse> {
    try {
    const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

    // Basic counts
    const [
      companyCount,
      vendorCount,
      employeeCount,
      deviceCount,
      transactionCount
    ] = await Promise.all([
      CompanyModel.countDocuments({ partnerId: partnerObjectId, isDeleted: false }),
      VendorModel.countDocuments({ partnerId: partnerObjectId, isDeleted: false }),
      EmployeeModel.countDocuments({ partnerId: partnerObjectId, isDeleted: false }),
      DeviceModel.countDocuments({ partnerId: partnerObjectId, isDeleted: false }),
      TransactionModel.countDocuments({ partnerId: partnerObjectId })
    ]);

    // Most used company
    const mostUsedCompany = await DeviceModel.aggregate([
      { $match: { partnerId: partnerObjectId, isDeleted: false } },
      { $group: { _id: "$companyIds", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "companies", localField: "_id", foreignField: "_id", as: "company" } },
      { $unwind: "$company" },
      { $project: { name: "$company.name", count: 1 } }
    ]);

    // Most used vendor
    const mostUsedVendor = await DeviceModel.aggregate([
      { $match: { partnerId: partnerObjectId, isDeleted: false } },
      { $unwind: "$sellHistory" },
      { $group: { _id: "$sellHistory.vendor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" } },
      { $unwind: "$vendor" },
      { $project: { name: "$vendor.name", count: 1 } }
    ]);

    // Most active employee
    const mostActiveEmployee = await DeviceModel.aggregate([
      { $match: { partnerId: partnerObjectId, isDeleted: false } },
      { $group: { _id: "$pickedBy", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "employees", localField: "_id", foreignField: "_id", as: "employee" } },
      { $unwind: "$employee" },
      { $project: { name: "$employee.name", count: 1 } }
    ]);

    // Device statistics
    const deviceStats = await DeviceModel.aggregate([
      { $match: { partnerId: partnerObjectId, isDeleted: false } },
      {
        $addFields: {
          latestSellHistory: {
            $arrayElemAt: [
              { $sortArray: { input: "$sellHistory", sortBy: { createdAt: -1 } } },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          soldDevices: {
            $sum: {
              $cond: [
                { $eq: ["$latestSellHistory.type", "sell"] },
                1,
                0
              ]
            }
          },
          returnedDevices: {
            $sum: {
              $cond: [
                { $eq: ["$latestSellHistory.type", "return"] },
                1,
                0
              ]
            }
          },
          totalProfit: { $sum: "$profit" }
        }
      }
    ]);

    // Payment mode statistics - money received
    const paymentStatsReceived = await TransactionModel.aggregate([
      { $match: { partnerId: partnerObjectId, paymentMode: { $exists: true }, type: { $ne: "return" } } },
      {
        $group: {
          _id: "$paymentMode",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Payment mode statistics - money returned
    const paymentStatsReturned = await TransactionModel.aggregate([
      { $match: { partnerId: partnerObjectId, paymentMode: { $exists: true }, type: "return" } },
      {
        $group: {
          _id: "$paymentMode",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Financial overview
    const financialStats = await TransactionModel.aggregate([
      { $match: { partnerId: partnerObjectId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Total investment
    const totalInvestment = await TransactionModel.aggregate([
      { $match: { partnerId: partnerObjectId, type: "investment" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get partner's current cash amount
    const partner = await PartnerModel.findById(partnerObjectId).select('cashAmount');

      const data = {
        counts: {
          companies: companyCount,
          vendors: vendorCount,
          employees: employeeCount,
          devices: deviceCount,
          transactions: transactionCount
        },
        mostUsed: {
          company: mostUsedCompany[0] || null,
          vendor: mostUsedVendor[0] || null,
          employee: mostActiveEmployee[0] || null
        },
        deviceStats: deviceStats[0] || {
          totalDevices: 0,
          soldDevices: 0,
          returnedDevices: 0,
          totalProfit: 0
        },
        paymentModes: {
          received: {
            cash: paymentStatsReceived.find(p => p._id === "cash")?.total || 0,
            upi: paymentStatsReceived.find(p => p._id === "upi")?.total || 0,
            card: paymentStatsReceived.find(p => p._id === "card")?.total || 0
          },
          returned: {
            cash: paymentStatsReturned.find(p => p._id === "cash")?.total || 0,
            upi: paymentStatsReturned.find(p => p._id === "upi")?.total || 0,
            card: paymentStatsReturned.find(p => p._id === "card")?.total || 0
          }
        },
        financial: {
          totalInvestment: totalInvestment[0]?.total || 0,
          totalSales: financialStats.find(f => f._id === "sell")?.total || 0,
          totalReturns: financialStats.find(f => f._id === "return")?.total || 0,
          totalCredit: financialStats.find(f => f._id === "credit")?.total || 0,
          totalDebit: financialStats.find(f => f._id === "debit")?.total || 0,
          currentCash: partner?.cashAmount || 0
        }
      };

      return {
        data,
        message: "Dashboard statistics retrieved successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) throw error;
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}