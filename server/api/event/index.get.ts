export default defineEventHandler(async event => {
    try {
        const events = await EventModel.find();
        if (!events) {
            throw createError({
                statusCode: 400,
                message: "Owhhh data not saved yet"
            })
        }
        return events;
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: "Owhhh system error"
        })
    }
})