import { ProjectModel } from "~/server/models/ProjectModel";

export default defineEventHandler(async (ev) => {
  try {
    const user = await ensureAuth(ev);
    if (!user.profile.isAdministrator || !user.profile.isDepartement) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or departement to use this endpoint",
      });
    }
    const { id } = getQuery(ev);
    const body = await readBody(ev);
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
