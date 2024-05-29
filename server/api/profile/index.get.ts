import { ProfileModel } from "~/server/models/ProfileModel";
import { IReqProfileQuery } from "~/types/IRequestPost";
export default defineEventHandler(async (event) => {
  try {
    let { NIM, perPage, page, fullName, email } =
      getQuery<IReqProfileQuery>(event);
    let query = {};
    if (fullName) {
      query = {
        fullName: {
          $regex: `.*${fullName}.*`,
          $options: `i`,
        },
      };
    }
    if (email) {
      query = {
        email: {
          $regex: `.*${email}.*`,
          $options: `i`,
        },
        // $text: {
        //   $search: search,
        //   $caseSensitive: false,
        //   $diacriticSensitive: true,
        // },
      };
    }

    const user = await ensureAuth(event);
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to access this",
      });
    }

    if (!user.profile.isDepartement || !user.profile.isAdministrator) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to access this",
      });
    }
    if (NIM) {
      query = {
        $expr: {
          $regexMatch: {
            input: { $toString: "$NIM" },
            regex: new RegExp(NIM),
          },
        },
      };
      // const profile = await ProfileModel.findOne({ NIM });
      // return profile;
    }
    const length = await ProfileModel.countDocuments(query);
    const profiles = await ProfileModel.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);
    return {
      profiles,
      length,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
