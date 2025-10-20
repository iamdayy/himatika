import EncryptionModel from "~~/server/models/EncryptionModel";
import SignModel from "~~/server/models/SignModel";
import { verifyDocSignature } from "~~/server/utils/encryption";
import { IDoc, IRequestSign } from "~~/types";

export default defineEventHandler(async (event) => {
    try {
        const { signature } = await readBody(event);
      const sign = await SignModel
        .findOne({ signature })
        .populate("document");
      if (!sign) {
        return {
          status: 404,
          message: "Sign not found",
          data: null,
        };
      }
      const encryptionData = await EncryptionModel.findById(
        sign.encryption
      );
      if (!encryptionData) {
        return {
          status: 404,
          message: "Encryption not found",
          data: null,
        };
      }
      const public_key = encryptionData.public_key;
      const signInComplete = (sign.document as IDoc).signs?.some(
        (sign: IRequestSign) => !sign.signed
      );
      const hashVerified = verifyDocSignature(
        public_key,
        sign.documentHash,
        sign.signature
      );
      const verified = hashVerified && !signInComplete;
      if (!verified) {
        return {
          status: 400,
          message: "Sign not verified",
          data: sign.document as IDoc,
        };
      }
      return {
        status: 200,
        message: "Sign verified successfully",
        data: sign.document as IDoc,
      };
    } catch (error) {
      console.error(error);
      throw {
        status: 500,
        message: "Internal server error",
        data: error,
      };
    }
});