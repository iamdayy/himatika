import { ProfileModel } from "~/server/models/ProfileModel";
import { ProjectModel } from "~/server/models/ProjectModel";
import { checkAuth } from "~/server/utils/authHelper";
import { IReqProjectQuery } from "~/types/IRequestPost";

const getNimFromID = async (id: string) => {
  const profile = await ProfileModel.findById(id);

  if (!profile?.NIM) {
    throw createError({
      statusCode: 404,
      statusMessage: "Someone is error",
    });
  }

  return profile.NIM;
};

export default defineEventHandler(async (event) => {
  try {
    const { perPage, page, id } = getQuery<IReqProjectQuery>(event);
    if (id) {
      const project = await ProjectModel.findById(
        id,
        {},
        { autopopulate: false }
      );
      if (!project) {
        throw createError({
          statusCode: 404,
          statusMessage: "Project not found",
        });
      }
      const contributors = await Promise.all(
        project?.contributors?.map(async (contributor) => ({
          profile: await getNimFromID(contributor.profile as string),
          job: contributor.job,
        }))!
      );

      return {
        ...project.toJSON(),
        contributors,
      };
    }
    const roles: string[] = ["All", "External"];
    const auth = checkAuth(event);
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
