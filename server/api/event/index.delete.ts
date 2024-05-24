import { EventModel } from "~/server/models/EventModel";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const deleted = await EventModel.findByIdAndDelete(id);
    if (!deleted) {
      throw createError({
        statusCode: 400,
        message: "Owhhh data not saved yet",
      });
    }
    return true;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Owhhh system error",
    });
  }
});
