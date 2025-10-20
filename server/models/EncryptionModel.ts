import { model, Schema } from "mongoose";
import { IEncryptionSchema } from "~~/types/ISchemas";


export const EncryptionSchema = new Schema<IEncryptionSchema>(
  {
    title: {
      type: String,
      required: true,
    },
    private_key: {
      encrypted_key: {
        type: String,
        required: true,
      },
      metadata: {
        iv: {
          type: String,
          required: true,
        },
        tag: {
          type: String,
        },
        key: {
          type: String,
          required: true,
        },
      },
    },
    public_key: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default  model<IEncryptionSchema>("Encryption", EncryptionSchema);
