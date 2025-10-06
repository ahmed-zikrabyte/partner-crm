import type { Request, Response } from "express";
import DashboardService from "../../services/partner/dashboard.partner.service";
import { catchAsync } from "../../../../utils/catch-async.util";
import { ApiResponse } from "../../../../utils/response.util";

export default class DashboardController {
  private dashboardService = new DashboardService();

  getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;
    const partnerId = user.role === "partner" ? user._id : user.partnerId;
    
    const response = await this.dashboardService.getDashboardStats(partnerId);
    
    return ApiResponse.success({
      res,
      message: response.message,
      data: response.data,
      statusCode: response.status,
    });
  });
}