export default defineEventHandler(async (ev) => {
    const { NIM, id } = await readBody(ev);
    try {
        const event = await EventModel.findById(id);
        const me = await ProfileModel.findOne({ NIM });
        event?.registered?.push({
            profile: me?._id
        });
        const saved = await event?.save();
        if (!saved) {
            throw createError({
                statusCode: 400,
                statusMessage: "Owhhh data not saved yet"
            })
        }
        return {
            status: true,
            statusMessage: "Success to register event " + event?.title,
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }
})