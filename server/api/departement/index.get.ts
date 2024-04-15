export default defineEventHandler(async (event) => {
    try {
        const departements = await DepartementModel.find();
        return departements;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});