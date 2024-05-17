import { seedEvent } from "~/server/dev/faker/EventFaker";

export default defineEventHandler(async (ev) => {
    try {
        seedEvent();
    } catch (error) {
        return error;
    }
})