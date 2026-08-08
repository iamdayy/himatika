import { Schema, model } from "mongoose";
import type { IOTPSchema } from "~~/types/ISchemas";

// OTP Schema
const otpSchema: Schema<IOTPSchema> = new Schema<IOTPSchema>({
  email: { type: String, required: true },
  code: { type: String, required: true },
  NIM: { type: Number, required: true },
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
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, expires: 0 },
});

// Compound unique: satu email bisa punya OTP aktif untuk tipe yang berbeda
otpSchema.index({ email: 1, type: 1 }, { unique: true });

export const OTPModel = mongoose.models.OTP || model<IOTPSchema>("OTP", otpSchema);
