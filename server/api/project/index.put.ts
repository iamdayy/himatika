import { ProfileModel } from "~/server/models/ProfileModel";
import { ProjectModel } from "~/server/models/ProjectModel";
import { IContributor, IProject } from "~/types";

export default defineEventHandler(async (ev) => {
  try {
    const user = await ensureAuth(ev);
    if (!user.profile.isAdministrator && !user.profile.isDepartement) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or departement to use this endpoint",
      });
    }
    const { id } = getQuery(ev);
    const body = await readBody<IProject>(ev);
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: "The project is'nt found",
      });
    }
    project.title = body.title;
    project.deadline = body.deadline;
    project.canSee = body.canSee;
    project.description = body.description;
    project.canRegister = body.canRegister;
    (project.contributors = (await Promise.all(
      body.contributors?.map(async (contributor) => ({
        profile: await getIdByNim(contributor.profile as number),
        job: contributor.job,
      }))!
    )) as IContributor[]),
      project.save();
    return {
      statusCode: 200,
      statusMessage: `Project ${project.title} updated`,
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
