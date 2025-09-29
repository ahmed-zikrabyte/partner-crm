import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

export interface IDevice {
  deviceId?: string;
  partnerId: mongoose.Types.ObjectId;
  companyIds: mongoose.Types.ObjectId;
  selectedCompanyIds?: string;
  author: {
    authorType: "partner" | "employee";
    authorId: mongoose.Types.ObjectId;
  };
  pickedBy: mongoose.Schema.Types.ObjectId;
  date: Date;
  serviceNumber: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  initialCost: number;
  cost: number;
  extraAmount: number;
  credit: number;
  perCredit: number;
  commission: number;
  gst: number;
  totalCost: number;
  profit?: number;
  sellHistory: {
    type: "sell" | "return";
    vendor: mongoose.Types.ObjectId;
    selling?: number; 
    returnAmount?: number;
    createdAt: Date;
  }[];
  box: string;
  warranty: string;
  issues: string;
  qrCodeUrl?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const sellHistorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["sell", "return"],
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vendor",
      required: true,
    },
    selling: {
      type: Number,
      validate: {
        validator: function (this: any, v: number) {
          return this.type !== "sell" || v !== undefined;
        },
        message: "selling is required for type 'sell'",
      },
    },
    returnAmount: {
      type: Number,
      validate: {
        validator: function (this: any, v: number) {
          return this.type !== "return" || v !== undefined;
        },
        message: "returnAmount is required for type 'return'",
      },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deviceSchema = new mongoose.Schema<IDevice>(
  {
    deviceId: { type: String, unique: true, trim: true },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
    },
    companyIds: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },
    author: {
      authorType: {
        type: String,
        enum: ["partner", "employee"],
        required: true,
      },
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "author.authorType",
      },
    },
    pickedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    selectedCompanyIds: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    serviceNumber: { type: String, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    imei1: { type: String, trim: true },
    imei2: { type: String, trim: true },
    initialCost: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    extraAmount: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    perCredit: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    profit: { type: Number },
    sellHistory: [sellHistorySchema],
    box: { type: String, trim: true },
    warranty: { type: String, trim: true },
    issues: { type: String, trim: true },
    qrCodeUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

deviceSchema.pre("save", function (next) {
  if (!this.deviceId) {
    this.deviceId = `DEV-${nanoid()}`;
  }
  next();
});

export const DEVICE_DB_REF = "device";
export const DeviceModel = mongoose.model<IDevice>(DEVICE_DB_REF, deviceSchema);
