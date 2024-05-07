export default defineEventHandler(async (ev) => {
    const { NIM, id } = getQuery(ev);
    try {
        const event = await EventModel.findById(id);
        const me = await ProfileModel.findOne({ NIM });
        event?.registered?.push({
            profile: me?._id
        });
        await event?.save();
        return {
            event,
            me
        }
    } catch (error: any) {
        
    }
})