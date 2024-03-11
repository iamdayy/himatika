export default defineEventHandler(async event => {
    try {
        const body = readBody(event);
        const saved = await EventModel.create(body)
        if (!saved) {
            throw createError({
                statusCode: 400,
                message: "Owhhh data not saved yet"
            })
        }
        return true
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: "Owhhh system error"
        })
    }
})