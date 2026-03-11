import { GuestModel } from "~~/server/models/GuestModel";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { fullName, email, phone, instance, password } = body;

    if (!fullName || !email || !password || !phone || !instance) {
        throw createError({
            statusCode: 400,
            statusMessage: "All fields are required",
        });
    }

    // Check if email already exists in GuestModel
    const existingGuest = await GuestModel.findOne({ email });
    if (existingGuest) {
        throw createError({
            statusCode: 400,
            statusMessage: "Email already registered as guest",
        });
    }

    // Check if email exists in UserModel (as Member or Guest)
    // Actually UserModel maps to a Member or Guest. 
    // If a Member uses this email, should we block? 
    // Yes, to avoid confusion. But UserModel doesn't store email directly.
    // We rely on unique email constraints in MemberModel and GuestModel.

    try {
        // Create Guest
        await GuestModel.create({
            fullName,
            email,
            phone,
            instance,
            password 
            // password hashing handled by pre-save hook in GuestModel
        });

        return {
            statusCode: 201,
            message: "Guest registered successfully",
        };

    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Registration failed",
        });
    }
});
