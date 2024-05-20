import { IDepartementSchema } from "~/types/ISchemas";
import { defineMongooseModel } from "#nuxt/mongoose";
import { Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { PeriodSchema } from "./AdministratorModel";

export const DepartementModel = defineMongooseModel<IDepartementSchema>("Departement",
    {
        profile: {
            type: Types.ObjectId,
            required: true,
            ref: "Profile",
            autopopulate: { select: "NIM avatar fullName class semester" }
        },
        departement: {
            type: String,
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
    }
);