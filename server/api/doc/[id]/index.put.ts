import { Types } from "mongoose";
import { DocModel } from "~~/server/models/DocModel";
import SignModel from "~~/server/models/SignModel";
import { IFile } from "~~/types";
import { IReqDoc } from "~~/types/IRequestPost";
export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusMessage: "Unauthorized",
      });
    }
    console.log("IP", getRequestIP(event));
    const body = await readBody<IReqDoc>(event);
    const doc = await DocModel.findById(id);
    if (!doc) {
      throw createError({
        statusCode: 404,
        statusMessage: "Doc not found",
      });
    }
    if (typeof body.doc === "string") {
      doc.doc = body.doc;
    } else {
      const BASE_DOC_FOLDER = `/uploads/docs/${doc.label.replace(/\s+/g, "_")}`;
      if (doc.doc) {
        let oldDocUrl = undefined;
        oldDocUrl = doc.doc as string;
        if (doc.trails) {
          doc.trails[doc.trails.length - 1].doc = oldDocUrl;
        }
      }
      let docUrl = "";
      const docBody = body.doc as IFile;
      // Handle main doc upload
      if (docBody.type?.startsWith("application/")) {
        const hashedName = await storeFileLocally(docBody, 12, BASE_DOC_FOLDER);
        docUrl = `${BASE_DOC_FOLDER}/${hashedName}`;
        doc.doc = docUrl;
      } else {
        throw createError({
          statusMessage: "Please upload nothing but docs.",
        });
      }
    }
    doc.trails?.push({
      user: (await findMemberByNim(user.member.NIM)) as Types.ObjectId,
      action: body.action || "UPDATE",
      actionAt: new Date(),
      actionIp: getRequestIP(event) || "",
    });
    const savedDoc = await doc.save();
    if (!savedDoc) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to save doc",
      });
    }
    if (body.action === "SIGN") {
      const signId = await SignModel.findOne({
        signature: body.signature,
      });
      if (!signId) {
        throw createError({
          statusCode: 404,
          statusMessage: "Signature not found",
        });
      }
      const updatedDoc = await DocModel.findOneAndUpdate(
        { _id: id, "signs.user": await findMemberByNim(user.member.NIM) }, // Use _id and correct query
        {
          $set: {
            "signs.$.signed": true,
            "signs.$.signedAt": new Date(),
            "signs.$.signedIp": getRequestIP(event) || "",
            "signs.$.sign": signId._id,
          },
        },
        { new: true } // This is crucial: Return the updated document
      );

      if (!updatedDoc) {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to sign doc or user not found in signs", // More informative message
        });
      }
    }
    return {
      statusCode: 200,
      statusMessage: "Doc updated successfully",
    };
  } catch (error: any) {
    console.log(error);
    return {
      statusCode: 500,
      statusMessage: error.statusMessage || "Internal Server Error",
      error: error,
    };
  }
});
