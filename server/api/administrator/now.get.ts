export default defineEventHandler(async (event) => {
    try {
        const administrator = await AdministratorModel.find({ 'period.start': { '$gte': new Date(Date.now()) }, 'period.end': { '$lte': new Date(Date.now()) } });
        return administrator;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});