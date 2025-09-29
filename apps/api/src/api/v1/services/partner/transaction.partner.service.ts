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
    vendorId: string;
    deviceId?: string;
    amount: number;
    note?: string;
    paymentMode: "upi" | "card" | "cash";
    type: "return" | "sell";
    date?: Date;
  }): Promise<ServiceResponse> {
    try {
      const requiredFields = [
        "partnerId",
        "author",
        "vendorId",
        "amount",
        "paymentMode",
        "type",
      ];
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
        vendorId: new mongoose.Types.ObjectId(entry.vendorId),
        ...(entry.deviceId && {
          deviceId: new mongoose.Types.ObjectId(entry.deviceId),
        }),
        amount: entry.amount,
        note: entry.note || "",
        paymentMode: entry.paymentMode,
        type: entry.type,
        date: entry.date || new Date(),
      });

      // Handle sell transaction
      if (entry.type === "sell") {
        if (entry.paymentMode === "cash") {
          await Promise.all([
            VendorModel.findByIdAndUpdate(entry.vendorId, {
              $inc: { amount: -entry.amount },
            }),
            PartnerModel.findByIdAndUpdate(entry.partnerId, {
              $inc: { cashAmount: entry.amount },
            }),
          ]);
        } else if (
          entry.paymentMode === "upi" ||
          entry.paymentMode === "card"
        ) {
          await VendorModel.findByIdAndUpdate(entry.vendorId, {
            $inc: { amount: -entry.amount },
          });
        }

        // Update device sellHistory
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
        const vendor = await VendorModel.findById(entry.vendorId);
        const partner = await PartnerModel.findById(entry.partnerId);

        if (!vendor || !partner)
          throw new AppError("Vendor or Partner not found", HTTP.BAD_REQUEST);

        let remainingReturn = entry.amount;

        // 1️⃣ Deduct from vendor owed first
        if (vendor.amount > 0) {
          const deductFromVendor = Math.min(remainingReturn, vendor.amount);
          await VendorModel.findByIdAndUpdate(entry.vendorId, {
            $inc: { amount: -deductFromVendor },
          });
          remainingReturn -= deductFromVendor;
        }

        // 2️⃣ Deduct remaining from partner cash if paymentMode = cash
        if (remainingReturn > 0 && entry.paymentMode === "cash") {
          await PartnerModel.findByIdAndUpdate(entry.partnerId, {
            $inc: { cashAmount: -remainingReturn },
          });
        }

        // 3️⃣ Update device sellHistory
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

      return {
        message: `${entry.type === "return" ? "Return" : "Transaction"} created successfully`,
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
    type?: "return" | "sell"
  ): Promise<ServiceResponse> {
    try {
      const query: any = { partnerId: new mongoose.Types.ObjectId(partnerId) };
      if (vendorId) query.vendorId = new mongoose.Types.ObjectId(vendorId);
      if (type) query.type = type;

      const transactions = await TransactionModel.find(query)
        .populate("vendorId", "name")
        .populate("deviceId", "deviceId brand model")
        .populate("author.authorId", "name")
        .sort({ date: -1 });

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

      if (!transaction) {
        throw new AppError("Transaction not found", HTTP.NOT_FOUND);
      }

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
}
