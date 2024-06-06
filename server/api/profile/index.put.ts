import { ProfileModel } from "~/server/models/ProfileModel";
import { IProfile } from "~/types";

export default defineEventHandler(async (event) => {
  try {
    const user = await ensureAuth(event);
    const { NIM } = getQuery(event);

    if (user.profile.NIM != NIM) {
      throw createError({
        statusCode: 403,
        statusMessage: "Who are you ? it's not your profile!!!",
      });
    }
    const body = await readBody<IProfile>(event);
    const profile = await ProfileModel.findOne({ NIM });
    if (!profile) {
      throw createError({
        statusCode: 404,
        message: "Profile not found",
      });
    }
    profile.fullName = body.fullName;
    profile.avatar = body.avatar;
    profile.email = body.email;
    profile.class = body.class;
    profile.citizen = body.citizen;
    profile.semester = body.semester;
    profile.sex = body.sex;
    profile.religion = body.religion;
    profile.phone = body.phone;
    profile.birth = body.birth;
    await profile.save();
    return {
      statusCode: 200,
      statusMessage: `Profile ${profile.NIM} updated`,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
