import { ProfileModel } from "~/server/models/ProfileModel";
import { ProjectModel } from "~/server/models/ProjectModel";
import { IProject } from "~/types";

export default defineEventHandler(async (event) => {
  try {
    const user = await ensureAuth(event);
    if (!user.profile.isAdministrator && !user.profile.isDepartement) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or departement to use this endpoint",
      });
    }
    const body = await readBody<IProject>(event);
    const project = new ProjectModel({
      ...body,
      contributors: await Promise.all(
        body.contributors?.map(async (contributor) => ({
          profile: await getIdByNim(contributor.profile as number),
          job: contributor.job,
        }))!
      ),
    });
    const saved = await project.save();
    if (!saved) {
      return {
        statusCode: 400,
        statusMessage: `Failed to add new Project ${project.title}`,
      };
    }
    return {
      statusCode: 200,
      statusMessage: `Success to add new Project ${project.title}`,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});

const getIdByNim = async (NIM: number): Promise<unknown> => {
  try {
    const profile = await ProfileModel.findOne({ NIM });
    return profile?._id;
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
};
