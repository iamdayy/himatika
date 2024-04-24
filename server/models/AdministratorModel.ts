import { defineMongooseModel } from "#nuxt/mongoose";
import { Types, Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IPeriod } from "~/types";
import { IAdministratorSchema, IAdministratorMemberSchema } from "~/types/ISchemas";

export const PeriodSchema = new Schema<IPeriod>({
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    }
});

export const AdministratorMemberSchema = new Schema<IAdministratorMemberSchema>({
    role: {
        type: String,
        required: true,
    },
    profile: {
        type: Types.ObjectId,
        required: true,
        ref: "Profile",
        autopopulate: true
    }
})

export const AdministratorModel = defineMongooseModel<IAdministratorSchema>("Administrator", {
    AdministratorMembers: {
        type: [AdministratorMemberSchema],
        required: true
    },
    period: {
        type: PeriodSchema,
        required: true
    }
},
{

},
(schema) => {
    schema.plugin(mongooseAutoPopulate)
});