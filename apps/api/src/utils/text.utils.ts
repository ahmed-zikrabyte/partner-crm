import jwt, { type SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env";

export function camelCaseToNormalCase(text: string) {
  if (!text) return "";
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function normalCaseToCamelCase(text: string): string {
  if (!text) return "";
  return text
    .split(" ")
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

export function generateSlug(input: string): string {
  // Convert to lowercase and replace all non-alphanumeric characters with hyphens
  const hyphenated = input.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Remove leading and trailing hyphens
  return hyphenated.replace(/^-+/, "").replace(/-+$/, "");
}

export function getEmptyFields(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).filter((key) => {
    const value = obj[key];

    if (value === null || value === undefined) return true;

    if (typeof value === "string" && value.trim() === "") return true;

    if (Array.isArray(value) && value.length === 0) return true;

    return false;
  });
}

export default function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .substring(0, length);
}

export function generateToken(userId: string, role: string): string {
  const expiresIn = ENV.jwt.expiresIn || "7d";

  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };
  return jwt.sign({ id: userId, role }, ENV.jwt.secret, options) as string;
}

export function generateAdminToken(payload: {
  id: string;
  role: string;
}): string {
  const expiresIn = ENV.jwt.expiresIn || "7d";
  const options: SignOptions = { expiresIn: expiresIn as any };

  return jwt.sign(payload, ENV.jwt.secret, options);
}

export function generatePartnerToken(payload: {
  id: string;
  role: string;
}): string {
  const expiresIn = ENV.jwt.expiresIn || "7d";
  const options: SignOptions = { expiresIn: expiresIn as any };

  return jwt.sign(payload, ENV.jwt.secret, options);
}
