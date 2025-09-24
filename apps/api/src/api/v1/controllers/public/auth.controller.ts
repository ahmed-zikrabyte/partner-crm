import {Request, Response} from "express";
import catchAsync from "../../../../utils/catchAsync";
import {registerUser, loginUser} from "../../services/public/auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
  const {user, token} = await registerUser(req.body);
  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const {user, token} = await loginUser(req.body);
  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});
