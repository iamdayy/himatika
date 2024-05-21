import { ProjectModel } from "~/server/models/ProjectModel";
import { checkAuth } from "~/server/utils/authHelper";

export default defineEventHandler(async (event) => {
  try {
    const { perPage, page } = getQuery<{ perPage: number; page: number }>(
      event
    );
    const roles: string[] = ["All", "External"];
    const auth = checkAuth(event)
    if (auth) {
    const user = await ensureAuth(event);
      if (user.profile.isAdministrator) {
        if (!roles.includes("Internal")) {
          roles.push("Internal");
        }
        roles.push("Admin");
      }
      if (user.profile.isDepartement) {
        if (!roles.includes("Internal")) {
          roles.push("Internal");
        }
        roles.push("Departement");
      }
    }
    const projectsLength = await ProjectModel.countDocuments({
      deadline: { $gte: new Date(Date.now()) },
      canSee: { $in: roles },
    });
    const projects = await ProjectModel.find({
      deadline: { $gte: new Date(Date.now()) },
      canSee: { $in: roles },
    })
      .skip((page - 1) * perPage)
      .limit(perPage);
    return {
      projects,
      length: projectsLength,
    };
  } catch (error: any) {
    return createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
