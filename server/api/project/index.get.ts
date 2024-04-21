import { ProjectModel } from "~/server/models/ProjectModel";

export default defineEventHandler(async (event) => {
    try {
        const projects = await ProjectModel.find();
        return projects;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
})