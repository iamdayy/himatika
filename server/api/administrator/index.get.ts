export default defineEventHandler(async (event) => {
    try {
        const administrators = await AdministratorModel.find();
        return administrators;
    } catch (error: any) {
        return createError({
            statusCode: error.statusCode,
            message: error.message
        });
    }
});