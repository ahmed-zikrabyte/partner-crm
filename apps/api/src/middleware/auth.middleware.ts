import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { ROLES } from '../constants';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

const verifyToken = (token: string, secret: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
};

export const protect = (role: 'admin' | 'client') =>
  catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const secret = role === ROLES.ADMIN ? config.adminJwt.secret : config.jwt.secret;

    try {
      const decoded = await verifyToken(token, secret);
      req.user = decoded;
      next();
    } catch (error) {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
  });
