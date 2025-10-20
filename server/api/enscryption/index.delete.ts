import EncryptionModel from "~~/server/models/EncryptionModel";
import { IResponse } from "~~/types/IResponse";

export default defineEventHandler(async (event): Promise<IResponse> => {
    try {
        const { id } = getQuery(event);
        if (!id) {
          throw {
            status: 400,
            message: "Missing id",
            data: null,
          };
        }
        const encryption = await EncryptionModel.findById(id);
        if (!encryption) {
          throw {
            status: 404,
            message: "Encryption not found",
            data: null,
          };
        }
      await EncryptionModel.findByIdAndDelete(id);
      return {
        statusCode: 200,
        statusMessage: "Encryption deleted successfully",
      };
    } catch (error) {
      throw {
        statusCode: 500,
        statusMessage: "Internal server error",
        data: error,
      };
    }
})