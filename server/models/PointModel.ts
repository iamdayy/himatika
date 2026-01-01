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

export const PointModel = mongoose.model("PointLog", pointSchema);
