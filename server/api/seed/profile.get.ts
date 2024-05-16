import { seedProfile } from "~/server/dev/faker/ProfileFaker";

export default defineEventHandler(async (ev) => {
    try {
        seedProfile();
    } catch (error) {
        return error;
    }
})