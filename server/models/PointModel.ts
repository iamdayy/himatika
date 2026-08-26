import mongoose, { Schema } from "mongoose";
import { IPointLogSchema } from "~~/types/ISchemas";

const pointSchema = new Schema<IPointLogSchema>(
  {
    member: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    admin: {
      // Admin yang meng-approve / menginput
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      // Admin bisa mengedit ini saat approval
      type: Number,
      required: true,
      min: 0, // koreksi negatif harus lewat proses admin yang eksplisit
      default: 0,
    },
    reason: {
      // Judul prestasi: "Juara 1 Lomba Web Design"
      type: String,
      required: true,
    },
    description: {
      // Detail tambahan
      type: String,
    },
    type: {
      type: String,
      enum: ["achievement", "activity"], // Sesuai request: Hanya achievement & activity
      default: "achievement",
    },
    proof: {
      // URL File Bukti (Sertifikat/Foto)
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Jika admin yang input -> approved, jika member -> pending
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hot paths: achievement list per member (filter status+sort date),
// organizer queue by status, dan virtual manualPoints per member.
pointSchema.index({ member: 1, status: 1, date: -1 });
pointSchema.index({ status: 1, date: -1 });

export const PointModel = mongoose.models.PointLog || mongoose.model("PointLog", pointSchema);
