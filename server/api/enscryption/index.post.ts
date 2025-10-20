import EncryptionModel from "~~/server/models/EncryptionModel";
import { encrypt } from "~~/server/utils/encrypt";
import { generateKeyPair } from "~~/server/utils/encryption";
import { IEncryption } from "~~/types";
import { IReqEncryption } from "~~/types/IRequestPost";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
    const { title, tag } = await readBody<IReqEncryption>(event);
    const { publicKey, privateKey } = generateKeyPair();
    const { encrypted, iv, key } = encrypt(privateKey);
    const encryptionData: IEncryption = {
      title,
      private_key: {
        encrypted_key: encrypted,
        metadata: {
          iv: iv,
          key: key,
          tag,
        },
      },
      public_key: publicKey,
    };
    try {
      const encryption = await EncryptionModel.create(encryptionData);
      return {
        statusCode: 20,
        statusMessage: "Encryption created successfully",
        // data: {
        //   title: encryption.title,
        //   public_key: encryption.public_key,
        //   tag: encryption.private_key.metadata.tag,
        // },
      };
    } catch (error) {
      console.log(error);
      throw {
        statusCode: 500,
        statusMessage: "Internal server error",
        data: error,
      };
    }
})