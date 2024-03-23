import { UserModel } from "../../models/UserModel";

export default defineEventHandler(async (event) => {
    try {
        const user = await UserModel.find();
        return user;
    } catch (error) {
        return error;
    }
})