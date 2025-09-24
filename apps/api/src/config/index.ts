import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET || "your-admin-secret-key",
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "1d",
  },
  rateLimiter: {
    windowMs: Number(process.env.RATE_LIMITER_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: Number(process.env.RATE_LIMITER_MAX_REQUESTS) || 100,
  },
};

export default config;
