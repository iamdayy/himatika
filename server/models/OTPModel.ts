import { Schema, model } from "mongoose";
import type { IOTPSchema } from "~~/types/ISchemas";

// OTP Schema
const otpSchema: Schema<IOTPSchema> = new Schema<IOTPSchema>({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  NIM: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "Verify Account",
      "Change Password",
      "Reset Password",
      "Change Email",
      "Change Phone",
      "Verify Email",
      "Verify Phone",
    ],
  },
  expiresAt: { type: Date, required: true },
});

export const OTPModel = model<IOTPSchema>("OTP", otpSchema);
