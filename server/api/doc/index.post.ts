import { put } from "@vercel/blob";
import { MultiPartData } from 'h3';
import { DocModel } from "~~/server/models/DocModel";
import { IDoc, ISign } from "~~/types";

export default defineEventHandler(async (event) => {
    try {
        const data = await customReadMultipartFormData<IDoc>(event)
        
        const BASE_DOC_FOLDER = `/uploads/img/doc`;
        const user = event.context.user;
        if (!user) {
            throw createError({
                statusMessage: "Unauthorized",
            });
        }

        const d = data.doc as MultiPartData;
        const fileName = `${BASE_DOC_FOLDER}/${user.member.NIM}/${hashText(d.name!)}.${d.type?.split("/")[1]}`;
        // Handle main doc upload
        const { url } = await put(fileName, d.data, { access: "public" });
        data.doc = url;
        const saved = await DocModel.create({
            ...data,
            signs: await Promise.all(await JSON.parse(data.signs as string).map(async (sign: ISign) => {
                const memberId = await findMemberByNim(sign.user as number);
                if (!memberId) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: "Member not found",
                    });
                }
                return {
                    ...sign,
                    user: memberId,
                }
            })),
            trails: [
                {
                    user: user.member._id,
                    action: "CREATE",
                }
            ],
            tags: JSON.parse(data.tags as string),
            uploader: user.member._id,
        });
        if (!saved) {
            throw createError({
                statusCode: 500,
                statusMessage: "Failed to save doc",
            });
        }
        return {
            statusCode: 200,
            statusMessage: "Doc added successfully",
        };
        
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            statusMessage: "Internal Server Error",
        };
    
    }
})