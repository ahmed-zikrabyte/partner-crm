import mongoose from "mongoose";

export interface IAttendance {
  partnerId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  status: "Present" | "Absent";
}

const attendanceSchema = new mongoose.Schema<IAttendance>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Present", "Absent"], required: true },
  },
  { timestamps: true, versionKey: false }
);

// Ensure unique attendance per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true, sparse: true });

export const ATTENDANCE_DB_REF = "attendance";
export const AttendanceModel = mongoose.model<IAttendance>(
  ATTENDANCE_DB_REF,
  attendanceSchema
);
