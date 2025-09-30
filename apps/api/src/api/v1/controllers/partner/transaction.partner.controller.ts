import type { Request, Response } from "express";
import TransactionService from "../../services/partner/transaction.partner.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class TransactionController {
  private transactionService = new TransactionService();

  create = catchAsync(async (req: Request, res: Response) => {
    const partnerId = req.user!._id;
    const { vendorId, deviceId, amount, note, paymentMode, type, date } = req.body;

    // Validate type
    if (!["sell", "return", "credit", "debit"].includes(type)) {
      return ApiResponse.error({
        res,
        message: "Invalid transaction type",
        statusCode: 400,
      });
    }

    const response = await this.transactionService.create({
      partnerId,
      author: {
        authorType: "partner",
        authorId: partnerId,
      },
      vendorId,
      deviceId,
      amount,
      note,
      paymentMode,
      type,
      date,
    });

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const partnerId = req.user!._id;
    const { vendorId, type, search, startDate, endDate } = req.query;

    // Validate type filter
    const validTypes = ["sell", "return", "credit", "debit"];
    const typeFilter = typeof type === "string" && validTypes.includes(type) ? type : undefined;

    const response = await this.transactionService.getAll(
      partnerId as string,
      typeof vendorId === "string" ? vendorId : undefined,
      typeFilter as any,
      typeof search === "string" ? search : undefined,
      typeof startDate === "string" ? startDate : undefined,
      typeof endDate === "string" ? endDate : undefined
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.error({
        res,
        message: "Transaction ID is required",
        statusCode: 400,
      });
    }

    const response = await this.transactionService.getById(id);

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });

  exportTransactions = catchAsync(async (req: Request, res: Response) => {
    const partnerId = req.user!._id;
    const { vendorId, type, startDate, endDate } = req.query;

    // Validate type filter
    const validTypes = ["sell", "return", "credit", "debit"];
    const typeFilter = typeof type === "string" && validTypes.includes(type) ? type : undefined;

    const filters = {
      ...(vendorId && { vendorId: vendorId as string }),
      ...(typeFilter && { type: typeFilter as any }),
      ...(startDate && { startDate: startDate as string }),
      ...(endDate && { endDate: endDate as string }),
    };

    const response = await this.transactionService.exportTransactions(
      partnerId as string,
      filters
    );

    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}
