import {Request, Response} from "express";
import * as profileService from "../../services/client/profile.service";
import {AuthenticatedRequest} from "src/middleware/auth.middleware";
import catchAsync from "../../../../utils/catchAsync";

export const getProfile = catchAsync(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await profileService.getProfileById(req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  }
);
