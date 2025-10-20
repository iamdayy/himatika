import { Types } from "mongoose";
import { DocModel } from "~~/server/models/DocModel";
import EncryptionModel from "~~/server/models/EncryptionModel";
import SignModel from "~~/server/models/SignModel";
import { decrypt } from "~~/server/utils/encrypt";
import { signData } from "~~/server/utils/encryption";
import { overlayQRAndSavePdf } from "~~/server/utils/pdfProcessor";
import { IMember, IRequestSign, ISign, ITrail } from "~~/types";
import { IReqSignDocument } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse & { data?: string }> => {
     try {
        const { encryption, docId, data, coordinates } = await readBody<IReqSignDocument>(event);
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
        sign: new Types.ObjectId(sign._id as string),
        signedAt: new Date(),
        signedIp: "",
      };

      // const cordinates = await findTextCoordinates(
      //   (doc.doc as string),
      //   `/${member.NIM}signature/`
      // );
      // if (!cordinates) {
      //   return {
      //     statusCode: 404,
      //     statusMessage: "Coordinates of Signature not found",
      //   };
      // }
      const BASE_DOC_FOLDER = `/uploads/docs/${doc.label.replace(
        /\s+/g,
        "_"
      )}/`;
      const newTrail: ITrail = {
        action: "SIGN",
        user: new Types.ObjectId(id),
        doc: doc.doc as string,
        actionAt: new Date(),
        actionIp: "", // You might want to capture the IP address here
      };
      doc.trails = doc.trails || [];
      doc.trails.push(newTrail);
      doc.doc = await overlayQRAndSavePdf(
        doc.doc as string,
        `${BASE_DOC_FOLDER}${hashText(doc.label)}.pdf`,
        sign.signature,
        coordinates
      );
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