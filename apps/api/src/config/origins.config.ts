import {ENV} from "./env";

const adminUrl = ENV.app.adminUrl;
const partnerUrl = ENV.app.partnerUrl;

const allowedOrigins = [
  "http://localhost:2000",
  "http://localhost:2001",
  "https://partner-crm-client.vercel.app",
  "https://partner-crm-admin.vercel.app",
  adminUrl,
  partnerUrl,
];

export {allowedOrigins, adminUrl, partnerUrl};
