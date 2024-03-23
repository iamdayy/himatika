import { defineMongooseModel } from "#nuxt/mongoose";
import { ICommitteeSchema, IEventSchema } from "~/types/ISchemas";
import { Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const CommitteeSchema = new Schema<ICommitteeSchema>({
    job: {
        type: String,
        required: true
    },
    user: {
        type: Types.ObjectId,
        required: true,
        ref: "Profile",
        autopopulate: true
    }
});

export const EventModel = defineMongooseModel<IEventSchema>("Event", {
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    at: {
        type: String,
        required: true
    },
    accessbility: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    committee: [CommitteeSchema]
},
{
},
(schema) => {
    schema.plugin(mongooseAutoPopulate)
});