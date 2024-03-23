import { defineMongooseModel } from "#nuxt/mongoose"
import { Types } from "mongoose"
import mongooseAutoPopulate from "mongoose-autopopulate"
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
        autopopulate: true,
    }
},
{},
(schema) => {
    schema.plugin(mongooseAutoPopulate)
})