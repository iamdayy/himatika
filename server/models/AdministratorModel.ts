import { defineMongooseModel } from "#nuxt/mongoose";
import { Types, Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IPeriod } from "~/types";
import { IAdministratorSchema } from "~/types/ISchemas";

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


export const AdministratorModel = defineMongooseModel<IAdministratorSchema>("Administrator", {
    chairman: {
        type: Types.ObjectId,
        required: true
    },
    viceChairman: {
        type: Types.ObjectId,
        required: true
    },
    secretary: {
        type: Types.ObjectId,
        required: true
    },
    viceSecretary: {
        type: Types.ObjectId,
        required: true
    },
    treasurer: {
        type: Types.ObjectId,
        required: true
    },
    viceTreasurer: {
        type: Types.ObjectId,
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