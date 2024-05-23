export default defineEventHandler(async (event) => {
  try {
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
    const events = await EventModel.find({ canSee: { $in: roles }});
    if (!events) {
      throw createError({
        statusCode: 400,
        message: "Owhhh data not saved yet",
      });
    }
    return events;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Owhhh system error",
    });
  }
});
