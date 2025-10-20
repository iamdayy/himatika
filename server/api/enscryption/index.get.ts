import EncryptionModel from "~~/server/models/EncryptionModel";
import { IEncryption } from "~~/types";
import { IEncryptionsResponse, IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse | IEncryptionsResponse> => {
    try {
        const { search, id } = getQuery(event);
        if (id) {
            const encryption = await EncryptionModel.findById(id);
            if (!encryption) {
                throw {
                    statusCode: 404,
                    statusMessage: "Encryption not found",
                    data: {
                        encryption: null,
                    },
                };
            }
            return {
                statusCode: 200,
                statusMessage: "Encryption retrieved successfully",
                data: {
                    encryption
                }
            }
        }
      const query = search ? { title: { $regex: search, $options: "i" } } : {};
      const encryptions = await EncryptionModel
        .find(query)
        .select("title public_key tag");
      return {
        statusCode: 200,
        statusMessage: "Encryption retrieved successfully",
        data: {
            encryptions: encryptions as IEncryption[],
            count: encryptions.length
        },
      };
    } catch (error) {
      throw {
        statusCode: 500,
        statusMessage: "Internal server error",
        data: error,
      };
    }
})