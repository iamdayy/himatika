import { defineMongooseModel } from "#nuxt/mongoose";
import { ICommitteeSchema, IEventSchema } from "~/types/ISchemas";
import { Schema, Types } from "mongoose";
import mongooseAutopopulate from "mongoose-autopopulate";

const CommitteeSchema = new Schema<ICommitteeSchema>({
    job: {
        type: String,
        required: true
    },
    person: {
        type: Types.ObjectId,
        ref: "Profile",
        autopopulate: true
    }
});

CommitteeSchema.plugin(mongooseAutopopulate);

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
});