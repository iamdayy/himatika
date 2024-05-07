export default defineEventHandler(async (ev) => {
    const { NIM, id, task } = await readBody(ev)
    try {
        const project = await ProjectModel.findById(id);
        const me = await ProfileModel.findOne({ NIM });
        project?.registered?.push({
            profile: me?._id,
            task
        });
        await project?.save();
        return {
            project,
            me
        }
    } catch (error: any) {
        
    }
})