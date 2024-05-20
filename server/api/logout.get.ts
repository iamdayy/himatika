import { killAuth } from "../utils/authHelper";
import { getServerSession } from "#auth"
export default defineEventHandler(async (event) => {
    try {
        const data = await killAuth(event);
        return data;
    } catch (error) {
        return error;
    }
})