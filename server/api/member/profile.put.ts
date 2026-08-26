import { MemberModel } from "~~/server/models/MemberModel";
import { z } from "zod";

const profileSchema = z.object({
  village: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  zip: z.union([z.string(), z.number()]).optional(),
  place: z.string().optional(),
  fullAddress: z.string().optional(),
  phone: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user || !user.member) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody(event);
    const parsedData = profileSchema.parse(body);

    // The Member schema nests these values under `address` and `birth`;
    // writing them flat was silently stripped by strict mode, making this
    // endpoint a no-op. Map to the real paths (dot-paths merge partially).
    const $set: Record<string, unknown> = {};
    for (const key of ["village", "district", "city", "province", "zip", "fullAddress"] as const) {
      if (parsedData[key] !== undefined) {
        $set[`address.${key}`] = parsedData[key];
      }
    }
    if (parsedData.place !== undefined) {
      $set["birth.place"] = parsedData.place;
    }
    if (parsedData.phone !== undefined) {
      $set.phone = parsedData.phone;
    }

    if (Object.keys($set).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Tidak ada data profil yang dikirim",
      });
    }

    const updatedMember = await MemberModel.findByIdAndUpdate(
      user.member._id,
      { $set },
      { new: true }
    );

    if (!updatedMember) {
      throw createError({ statusCode: 404, statusMessage: "Member not found" });
    }

    return {
      statusCode: 200,
      statusMessage: "Profile updated successfully",
      data: updatedMember
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Zod v4 exposes issues; fall back defensively for v3-style errors.
      const message = error.issues?.[0]?.message ?? error.errors?.[0]?.message ?? "Payload tidak valid";
      throw createError({ statusCode: 400, statusMessage: message });
    }
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
