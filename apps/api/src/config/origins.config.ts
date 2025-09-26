import { ENV } from "./env";

const adminUrl = ENV.app.adminUrl;
const partnerUrl = ENV.app.partnerUrl;

const allowedOrigins = [
  "http://localhost:2000",
  "http://localhost:2001",
  adminUrl,
  partnerUrl,
];

export { allowedOrigins, adminUrl, partnerUrl };
