import type { Request, Response } from "express";
import TransactionService from "../../services/partner/transaction.partner.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class TransactionController {
  private transactionService = new TransactionService();

  create = catchAsync(async (req: Request, res: Response) => {
    const partnerId = req.user!._id;
    const { vendorId, amount, note, paymentMode, type, date } = req.body;
    
    const response = await this.transactionService.create({
      partnerId,
      author: {
        authorType: "partner",
        authorId: partnerId,
      },
      vendorId,
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
    const { vendorId, type } = req.query;
    
    const response = await this.transactionService.getAll(
      partnerId as string,
      typeof vendorId === 'string' ? vendorId : undefined,
      typeof type === 'string' && (type === 'return' || type === 'sell') ? type : undefined
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
}
