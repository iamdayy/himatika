import { UserModel } from "../../models/UserModel";

export default defineEventHandler(async (event) => {
    try {
        const user = UserModel.find();
        return user;
    } catch (error) {
        return error;
    }
})