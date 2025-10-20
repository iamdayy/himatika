import EncryptionModel from "~~/server/models/EncryptionModel";

export default defineEventHandler(async (event) => {
    try {
      const tags = (await EncryptionModel.distinct(
        "private_key.metadata.tag"
      )) as string[];
      return {
        status: 200,
        message: "Tags retrieved successfully",
        data: tags,
      };
    } catch (error) {
      throw {
        status: 500,
        message: "Internal server error",
        data: error,
      };
    }
  })