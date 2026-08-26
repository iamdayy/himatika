import mongoose, {  Schema, model  } from "mongoose";
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
  // Jumlah percobaan verifikasi gagal; dipakai untuk lockout brute force.
  attempts: { type: Number, default: 0 },
  // Ditandai saat OTP dikonsumsi oleh langkah akhir (reset password,
  // aktivasi akun, dst). Kode yang sudah terpakai tidak bisa diverifikasi ulang.
  usedAt: { type: Date },
});

// Compound unique: satu email bisa punya OTP aktif untuk tipe yang berbeda
otpSchema.index({ email: 1, type: 1 }, { unique: true });

export const OTPModel = mongoose.models.OTP || model<IOTPSchema>("OTP", otpSchema);
