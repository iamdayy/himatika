import { defineMongooseModel } from "#nuxt/mongoose"
import { Types } from "mongoose"
import { ISessionSchema } from "~/types/ISchemas"

export const SessionModel = defineMongooseModel<ISessionSchema>("Session", {
    accessToken: {
        type: String,
    },
    token: {
        type: String,
        required: true
    },
    user: {
        type: Types.ObjectId,
        ref: "User",
    },
    createdAt: Date,
    updatedAt: Date,
},
{},
(schema) => {
    schema.index({ "createdAt": 1 }, { "expireAfterSeconds": 604800 })
})