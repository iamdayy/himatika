import { seedProject } from "~/server/dev/faker/ProjectFaker";

export default defineEventHandler(async (ev) => {
    try {
        seedProject();
    } catch (error) {
        return error;
    }
})