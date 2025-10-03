import { TransactionModel } from "../../../../models/transaction.model";
import { VendorModel } from "../../../../models/vendor.model";
import { PartnerModel } from "../../../../models/partner.model";
import { DeviceModel } from "../../../../models/device.model";
import { HTTP } from "../../../../config/http-status.config";
import { AppError } from "../../../../middleware/error.middleware";
import type { ServiceResponse } from "../../../../typings";
import mongoose from "mongoose";

export default class TransactionService {
  async create(entry: {
    partnerId: string;
    author: {
      authorType: "partner" | "employee";
      authorId: string;
    };
    vendorId?: string;
    deviceId?: string;
    amount: number;
    note?: string;
    paymentMode?: "upi" | "card" | "cash";
    type: "return" | "sell" | "credit" | "debit" | "investment";
    date?: Date;
  }): Promise<ServiceResponse> {
    try {
      const requiredFields = ["partnerId", "author", "amount", "type"];
      if ((entry.type === "sell" || entry.type === "return" || entry.type === "investment") && !entry.vendorId) {
        requiredFields.push("vendorId");
      }
      if (entry.type === "return" && !entry.deviceId) {
        throw new AppError(
          "deviceId is required for return transactions",
          HTTP.BAD_REQUEST
        );
      }

      const missingFields = requiredFields.filter(
        (field) => !entry[field as keyof typeof entry]
      );
      if (missingFields.length > 0) {
        throw new AppError(
          `Missing required fields: ${missingFields.join(", ")}`,
          HTTP.BAD_REQUEST
        );
      }

      const newTransaction = await TransactionModel.create({
        partnerId: new mongoose.Types.ObjectId(entry.partnerId),
        author: {
          authorType: entry.author.authorType,
          authorId: new mongoose.Types.ObjectId(entry.author.authorId),
        },
        ...(entry.vendorId && { vendorId: new mongoose.Types.ObjectId(entry.vendorId) }),
        ...(entry.deviceId && { deviceId: new mongoose.Types.ObjectId(entry.deviceId) }),
        amount: entry.amount,
        note: entry.note || "",
        ...(entry.paymentMode && { paymentMode: entry.paymentMode }),
        type: entry.type,
        date: entry.date || new Date(),
      });

      // Handle sell transaction
      if (entry.type === "sell") {
        if (!entry.vendorId) throw new AppError("vendorId is required for sell", HTTP.BAD_REQUEST);

        if (entry.paymentMode === "cash") {
          await Promise.all([
            VendorModel.findByIdAndUpdate(entry.vendorId, { $inc: { amount: -entry.amount } }),
            PartnerModel.findByIdAndUpdate(entry.partnerId, { $inc: { cashAmount: entry.amount } }),
          ]);
        } else if (entry.paymentMode === "upi" || entry.paymentMode === "card") {
          await VendorModel.findByIdAndUpdate(entry.vendorId, { $inc: { amount: -entry.amount } });
        }

        if (entry.deviceId) {
          await DeviceModel.findByIdAndUpdate(entry.deviceId, {
            $push: {
              sellHistory: {
                type: "sell",
                vendor: new mongoose.Types.ObjectId(entry.vendorId),
                selling: entry.amount,
                createdAt: new Date(),
              },
            },
          });
        }
      }

      // Handle return transaction
      if (entry.type === "return") {
        if (!entry.vendorId) throw new AppError("vendorId is required for return", HTTP.BAD_REQUEST);

        const vendor = await VendorModel.findById(entry.vendorId);
        const partner = await PartnerModel.findById(entry.partnerId);

        if (!vendor || !partner)
          throw new AppError("Vendor or Partner not found", HTTP.BAD_REQUEST);

        let remainingReturn = entry.amount;

        // Deduct from vendor owed first
        if (vendor.amount > 0) {
          const deductFromVendor = Math.min(remainingReturn, vendor.amount);
          await VendorModel.findByIdAndUpdate(entry.vendorId, { $inc: { amount: -deductFromVendor } });
          remainingReturn -= deductFromVendor;
        }

        // Deduct remaining from partner cash if cash return
        if (remainingReturn > 0 && entry.paymentMode === "cash") {
          await PartnerModel.findByIdAndUpdate(entry.partnerId, { $inc: { cashAmount: -remainingReturn } });
        }

        if (entry.deviceId) {
          await DeviceModel.findByIdAndUpdate(entry.deviceId, {
            $push: {
              sellHistory: {
                type: "return",
                vendor: new mongoose.Types.ObjectId(entry.vendorId),
                returnAmount: entry.amount,
                createdAt: new Date(),
              },
            },
          });
        }
      }

      // Handle investment transaction
      if (entry.type === "investment") {
        if (!entry.vendorId) throw new AppError("vendorId is required for investment", HTTP.BAD_REQUEST);
        
        await VendorModel.findByIdAndUpdate(entry.vendorId, { $inc: { amount: -entry.amount } });
        
        if (entry.paymentMode === "cash") {
          await PartnerModel.findByIdAndUpdate(entry.partnerId, { $inc: { cashAmount: entry.amount } });
        }
      }

      // Handle internal partner transactions (credit/debit)
      if (entry.type === "credit") {
        await PartnerModel.findByIdAndUpdate(entry.partnerId, { $inc: { cashAmount: entry.amount } });
      } else if (entry.type === "debit") {
        await PartnerModel.findByIdAndUpdate(entry.partnerId, { $inc: { cashAmount: -entry.amount } });
      }

      return {
        message: `${entry.type === "return" || entry.type === "sell" ? entry.type === "return" ? "Return" : "Transaction" : entry.type} created successfully`,
        data: newTransaction,
        status: HTTP.CREATED,
        success: true,
      };
    } catch (error) {
      console.error(error);
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(
    partnerId: string,
    vendorId?: string,
    type?: "return" | "sell" | "credit" | "debit" | "investment",
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResponse> {
    try {
      const query: any = { partnerId: new mongoose.Types.ObjectId(partnerId) };
      if (vendorId) query.vendorId = new mongoose.Types.ObjectId(vendorId);
      if (type) query.type = type;

      // Date filtering
      if (startDate || endDate) {
        const dateQuery: any = {};
        if (startDate) {
          dateQuery.$gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDateObj;
        }
        query.date = dateQuery;
      }

      let transactions = await TransactionModel.find(query)
        .populate("vendorId", "name")
        .populate("deviceId", "deviceId brand model")
        .populate("author.authorId", "name")
        .sort({ date: -1 });

      // Search filtering
      if (search) {
        const searchRegex = new RegExp(search, "i");
        transactions = transactions.filter(transaction => 
          (transaction.vendorId as any)?.name?.match(searchRegex) ||
          (transaction.deviceId as any)?.deviceId?.match(searchRegex) ||
          (transaction.deviceId as any)?.brand?.match(searchRegex) ||
          (transaction.deviceId as any)?.model?.match(searchRegex) ||
          transaction.note?.match(searchRegex) ||
          transaction.type?.match(searchRegex)
        );
      }

      return {
        message: "Transactions fetched successfully",
        data: transactions,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(transactionId: string): Promise<ServiceResponse> {
    try {
      const transaction = await TransactionModel.findById(transactionId)
        .populate("vendorId", "name")
        .populate("deviceId", "deviceId brand model")
        .populate("author.authorId", "name");

      if (!transaction) throw new AppError("Transaction not found", HTTP.NOT_FOUND);

      return {
        message: "Transaction fetched successfully",
        data: transaction,
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      console.error(error);
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }

  async exportTransactions(
    partnerId: string,
    filters?: {
      vendorId?: string;
      type?: "return" | "sell" | "credit" | "debit" | "investment";
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ServiceResponse> {
    try {
      const query: any = { partnerId: new mongoose.Types.ObjectId(partnerId) };
      if (filters?.vendorId) query.vendorId = new mongoose.Types.ObjectId(filters.vendorId);
      if (filters?.type) query.type = filters.type;

      // Date filtering
      if (filters?.startDate || filters?.endDate) {
        const dateQuery: any = {};
        if (filters.startDate) {
          dateQuery.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          const endDateObj = new Date(filters.endDate);
          endDateObj.setHours(23, 59, 59, 999);
          dateQuery.$lte = endDateObj;
        }
        query.date = dateQuery;
      }

      const transactions = await TransactionModel.find(query)
        .populate("vendorId", "name")
        .populate("deviceId", "deviceId brand model")
        .populate("author.authorId", "name")
        .sort({ date: -1 });

      const formatDate = (dateStr: string | Date) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "N/A";
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
      };

      const exportData = transactions.map((transaction) => ({
        "Transaction ID": transaction._id,
        "Date": formatDate(transaction.date),
        "Type": transaction.type.toUpperCase(),
        "Vendor": (transaction.vendorId as any)?.name || "N/A",
        "Device ID": (transaction.deviceId as any)?.deviceId || "N/A",
        "Device Brand": (transaction.deviceId as any)?.brand || "N/A",
        "Device Model": (transaction.deviceId as any)?.model || "N/A",
        "Amount": transaction.amount,
        "Payment Mode": transaction.paymentMode || "N/A",
        "Note": transaction.note || "N/A",
        "Created By": (transaction.author.authorId as any)?.name || "N/A",
      }));

      return {
        data: exportData,
        message: "Transactions exported successfully",
        status: HTTP.OK,
        success: true,
      };
    } catch (error) {
      throw new AppError((error as Error).message, HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}
