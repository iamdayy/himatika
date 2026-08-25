import { GuestModel } from "~~/server/models/GuestModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import {
  ensureCommitteeOrOrganizer,
  userOwnsRegistration,
} from "~~/server/utils/agendaAuth";

export default defineEventHandler(async (ev) => {
    try {
        const { id, registeredId } = ev.context.params as { id: string; registeredId: string };
        const { email } = await readBody(ev);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw createError({ statusCode: 400, statusMessage: "A valid email is required" });
        }

        const participant = await ParticipantModel.findById(registeredId).populate('guest');
        if (!participant) {
            throw createError({ statusCode: 404, statusMessage: "Participant not found" });
        }

        if (!participant.guest) {
            throw createError({ statusCode: 403, statusMessage: "Only guest participants can change their email here" });
        }

        // Ownership: the session's guest must own this registration; otherwise
        // only committee/organizer of the agenda may change it. (Previously any
        // authenticated user could hijack ticket delivery for any guest.)
        const isOwner = await userOwnsRegistration(ev.context.user, { guest: participant.guest._id });
        if (!isOwner) {
            await ensureCommitteeOrOrganizer(id, ev.context.user);
        }

        const { MemberModel } = await import("~~/server/models/MemberModel");
        const existingMember = await MemberModel.findOne({ email });
        if (existingMember) {
            throw createError({ statusCode: 409, statusMessage: "Email ini terdaftar sebagai Mahasiswa (Member)." });
        }
        
        const existingGuest = await GuestModel.findOne({ email, _id: { $ne: participant.guest._id } });
        if (existingGuest) {
            throw createError({ statusCode: 409, statusMessage: "Email sudah digunakan oleh guest lain." });
        }

        const guest = await GuestModel.findById(participant.guest._id);
        if (guest) {
            guest.email = email;
            await guest.save();
        }
        
        return {
            statusCode: 200,
            statusMessage: "Email updated successfully"
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || "Failed to update email"
        });
    }
});
