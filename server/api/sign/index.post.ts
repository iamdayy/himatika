import { Types } from "mongoose";
import { DocModel } from "~~/server/models/DocModel";
import EncryptionModel from "~~/server/models/EncryptionModel";
import SignModel from "~~/server/models/SignModel";
import { decrypt } from "~~/server/utils/encrypt";
import { signData } from "~~/server/utils/encryption";
import { IMember, IRequestSign, ISign, ITrail } from "~~/types";
import { IReqSignDocument } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse & { data?: string }> => {
     try {
        const { encryption, docId, data } = await readBody<IReqSignDocument>(event);
        const user = event.context.user;
        if (!user) {
          return {
            statusCode: 401,
            statusMessage: "Unauthorized",
          };
        }
        const member = user.member as IMember;
        if (!member) {
          return {
            statusCode: 404,
            statusMessage: "Member not found",
          }
        }

        const id = await findMemberByNim(member.NIM);
        if (!id) {
          return {
            statusCode: 404,
            statusMessage: "Member not found",
          }
        }
        
      const encryptionData = await EncryptionModel.findById(
        encryption
      );
      if (!encryptionData) {
        return {
          statusCode: 404,
          statusMessage: "Encryption not found",
        };
      }

      const private_key = decrypt(
        encryptionData?.private_key.encrypted_key,
        encryptionData?.private_key.metadata.iv,
        encryptionData?.private_key.metadata.key
      );

      const signature = signData(private_key, data);
      const newSign: ISign = {
        user: new Types.ObjectId(id),
        encryption,
        documentHash: data,
        signature,
      };
      const sign = await SignModel.create(newSign);
      if (!sign) {
        return {
          statusCode: 500,
          statusMessage: "Failed to create sign",
        };
      }
      const doc = await DocModel.findById(
        docId,
        {},
        {
          autopopulate: false,
        }
      );
      if (!doc) {
        return {
          statusCode: 404,
          statusMessage: "Document not found",
        };
      }

      if (!member) {
        return {
          statusCode: 404,
          statusMessage: "Member not found",
        };
      }

      doc.signs = doc.signs || [];
      const indexSign = doc.signs.findIndex(
        (sign: IRequestSign) => sign.user.toString() === id.toString()
      );

      if (indexSign < 0) {
        return {
          statusCode: 404,
          statusMessage: "Unavailable",
        };
      }

      doc.signs[indexSign] = {
        as: doc.signs[indexSign].as,
        user: new Types.ObjectId(sign.user as unknown as string),
        signed: true,
        sign: new Types.ObjectId(sign._id),
        signedAt: new Date(),
        signedIp: "",
        location: doc.signs[indexSign].location
      };
      const newTrail: ITrail = {
        action: "SIGN",
        user: new Types.ObjectId(id),
        doc: doc.doc as string,
        actionAt: new Date(),
        actionIp: "", // You might want to capture the IP address here
      };
      doc.trails = doc.trails || [];
      doc.trails.push(newTrail);
      if (!doc.signs[indexSign].location) {
        return {
          statusCode: 404,
          statusMessage: "Location not found",
        };
      }

      // Use Worker for PDF Overlay
      const signedDocUrl = await himatikaPdfWorker.processSignOverlay({
          pdf: doc.doc as string,
          outputBlobPath: new URL(doc.doc as string).pathname.split(".").shift() + "_signed_" + new Date().toISOString() + ".pdf", // get documents without domain & add number
          qrValue: sign.signature as string,
          locations: [doc.signs[indexSign].location]
      });

      if (!signedDocUrl) {
        return {
          statusCode: 500,
          statusMessage: "Failed to process PDF",
        };
      }

      doc.doc = signedDocUrl;
      await doc.save();
      return {
        statusCode: 200,
        statusMessage: "Sign created successfully",
        data: sign.signature as string,
      };
    } catch (error) {
      console.error(error);
      throw {
        statusCode: 500,
        statusMessage: "Internal server error",
        data: error,
      };
    }
})