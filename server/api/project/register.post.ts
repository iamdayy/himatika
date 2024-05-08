export default defineEventHandler(async (ev) => {
    const { NIM, id, task } = await readBody(ev)
    try {
        const project = await ProjectModel.findById(id);
        const me = await ProfileModel.findOne({ NIM });
        project?.registered?.push({
            profile: me?._id,
            task
        });
        const saved =  await project?.save();
        if (!saved) {
            throw createError({
                statusCode: 400,
                statusMessage: "Owhhh data not saved yet"
            })
        }
        return {
            status: true,
            statusMessage: "Success to register project " + project?.title,
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }
})