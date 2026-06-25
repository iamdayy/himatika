import { AgendaModel } from "~~/server/models/AgendaModel";
import { DocModel } from "~~/server/models/DocModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";

// Resolve member ObjectId from NIM string/number
async function findMemberByNim(nim: string | number) {
    const member = await MemberModel.findOne({ NIM: Number(nim) }).select('_id').lean();
    return member?._id ?? null;
}

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        const body = await readBody(event);

        const { agendaId, participantId, participantType, templateUrl, items, data, signers } = body;

        if (!templateUrl) {
            throw createError({ statusCode: 400, statusMessage: "Template URL is required" });
        }

        // 1. Check for cached Doc — return existing Doc URL immediately
        if (agendaId && participantId && participantType) {
            const agenda = await AgendaModel.findById(agendaId).lean();
            if (agenda) {
                let entry: any;
                if (participantType === 'committee') {
                    entry = await CommitteeModel.findById(participantId).lean();
                } else {
                    entry = await ParticipantModel.findById(participantId).lean();
                }
                if (entry?.certificateDoc) {
                    const existingDoc = await DocModel.findById(entry.certificateDoc).lean();
                    if (existingDoc) {
                        const signedCount = (existingDoc.signs as any[])?.filter((s: any) => s.signed).length ?? 0;
                        const signsTotal = (existingDoc.signs as any[])?.length ?? 0;
                        return { success: true, url: existingDoc.doc, docId: existingDoc._id, cached: true, signedCount, signsTotal };
                    }
                }
            }
        }
const codeItem = (items as any[])?.find((i: any) => i.type === 'code');
        let docNo = codeItem?.value?.trim() || '';
        if (!docNo) {
            // Fallback: auto-generate
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const seqCount = await DocModel.countDocuments({
                tags: 'certificate',
                createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
            });
            docNo = `CERT/${yyyy}/${mm}/${String(seqCount + 1).padStart(3, '0')}`;
        } else {
            const existingDoc = await DocModel.findOne({ no: docNo });
            if (existingDoc) {
                throw createError({ statusCode: 400, statusMessage: "Doc number already exists" });
            }
            const lastNumber = await DocModel.countDocuments({
                createdAt: {
                  $exists: true,
                  $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              });
            docNo = `${(lastNumber + 1).toString().padStart(3, "0")}/${docNo}`
            items.find((i: any) => i.type === 'code').value = docNo;
        }
        // 2. Generate certificate PDF via Python worker
        const response = await fetch(`${config.pdf_worker_api_url}/pdf/certificate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateUrl, items, data })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw createError({ statusCode: response.status, statusMessage: errorData.error || "Worker Error" });
        }

        const result = await response.json();
        const pdfUrl: string = result.url;
        

        // 4. Build signs array from each signature item's embedded signer (IRequestSign pattern)
        const signsArr: any[] = [];
        const signatureItems = (items as any[])?.filter((i: any) => i.type === 'signature') || [];
        for (const sigItem of signatureItems) {
            if (!sigItem.signerNIM) continue; // skip unlinked signature placeholders

            // Resolve member ObjectId from NIM
            const memberDoc = await findMemberByNim(sigItem.signerNIM);
            if (!memberDoc) continue;

            signsArr.push({
                user: memberDoc,        // IRequestSign.user (ObjectId)
                as: sigItem.signerAs || '',  // IRequestSign.as (role)
                signed: false,
                location: {
                    page: 1,
                    x: sigItem.x,
                    y: sigItem.y,
                    width: sigItem.width || 100,
                    height: sigItem.height || 50,
                }
            });
        }

        // 5. Resolve uploader member id from session
        const user = event.context.user;
        const uploaderId = user?.member?._id || user?.member?.NIM;

        // 6. Create the Doc — same structure as activiness letter docs
        const newDoc = await DocModel.create({
            label: `Sertifikat - ${data?.name || 'Peserta'}`,
            doc: pdfUrl,
            no: docNo,
            tags: ['certificate'],
            uploader: uploaderId,
            on: agendaId,
            onModel: 'Agenda',
            signs: signsArr,
            trails: uploaderId ? [{
                action: 'CREATE',
                user: uploaderId,
                doc: pdfUrl,
                actionAt: new Date(),
                actionIp: '',
            }] : [],
        });

        // 7. Save certificateDoc reference on participant/committee sub-document
        if (agendaId && participantId && participantType) {
            try {
                if (participantType === 'committee') {
                    await CommitteeModel.updateOne({ _id: participantId }, { $set: { certificateDoc: newDoc._id } });
                } else {
                    await ParticipantModel.updateOne({ _id: participantId }, { $set: { certificateDoc: newDoc._id } });
                }
            } catch (e) {
                console.error('Failed to store certificateDoc ref:', e);
            }
        }

        return {
            success: true,
            url: pdfUrl,
            docId: newDoc._id,
            cached: false,
            signedCount: 0,
            signsTotal: signsArr.length,
        };

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || "Internal Server Error"
        });
    }
});
