import { AgendaModel } from "~~/server/models/AgendaModel";
import { DocModel } from "~~/server/models/DocModel";

/**
 * GET /api/pdf/certificate?agendaId=&participantId=&participantType=
 *
 * Returns the sign status for a participant's certificate Doc.
 * Participants can only query their own (matched by participant._id = participantId).
 */
export default defineEventHandler(async (event) => {
    try {
        const { agendaId, participantId, participantType } = getQuery(event);

        if (!agendaId || !participantId || !participantType) {
            throw createError({ statusCode: 400, statusMessage: "Missing query params" });
        }

        const user = event.context.user;
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
        }

        const agenda = await AgendaModel.findById(agendaId).lean();
        if (!agenda) {
            throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
        }

        const list = participantType === 'committee' ? agenda.committees : agenda.participants;
        const entry = (list as any[])?.find((e: any) => e._id?.toString() === participantId);

        if (!entry) {
            throw createError({ statusCode: 404, statusMessage: "Participant not found" });
        }

        // Security: only allow user to query their own entry
        const memberNIM = user.member?.NIM;
        const entryMemberNIM = (entry.member as any)?.NIM ?? entry.member;
        if (memberNIM !== entryMemberNIM && !event.context.organizer) {
            throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }

        if (!entry.certificateDoc) {
            return {
                statusCode: 200,
                data: { hasCertificate: false, url: null, signedCount: 0, signsTotal: 0, docId: null }
            };
        }

        const doc = await DocModel.findById(entry.certificateDoc).lean();
        if (!doc) {
            return {
                statusCode: 200,
                data: { hasCertificate: false, url: null, signedCount: 0, signsTotal: 0, docId: null }
            };
        }

        const signedCount = (doc.signs as any[])?.filter((s: any) => s.signed).length ?? 0;
        const signsTotal = (doc.signs as any[])?.length ?? 0;

        return {
            statusCode: 200,
            data: {
                hasCertificate: true,
                url: doc.doc as string,
                signedCount,
                signsTotal,
                docId: (doc as any)._id,
            }
        };

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || "Internal Server Error"
        });
    }
});
