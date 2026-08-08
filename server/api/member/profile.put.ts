import { MemberModel } from "~~/server/models/MemberModel";
import { z } from "zod";

const profileSchema = z.object({
  village: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  zip: z.string().optional(),
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

    const updatedMember = await MemberModel.findByIdAndUpdate(
      user.member._id,
      { $set: parsedData },
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
      throw createError({ statusCode: 400, statusMessage: error.errors[0].message });
    }
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
