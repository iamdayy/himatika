import { defineMongooseModel } from "#nuxt/mongoose";
import { ICommitteeSchema, IEventSchema, IRegisteredSchema } from "~/types/ISchemas";
import { Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import type { TRole } from "~/types";
const CommitteeSchema = new Schema<ICommitteeSchema>({
    job: {
        type: String,
        required: true
    },
    user: {
        type: Types.ObjectId,
        required: true,
        ref: "Profile",
        autopopulate: { select: "NIM avatar fullName class semester" }
    }
});

const registeredSchema = new Schema<IRegisteredSchema>({
    profile: {
        type: Types.ObjectId,
        required: true,
        ref: "Profile",
        autopopulate: { select: "NIM avatar fullName class semester" }
    },
    task: {
        type: String,
    }
})

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
    canSee: {
        type: String,
        default: "All",
        enum: ["Admin", "Departement", "Internal", "All", "External", "No"]
    },
    description: {
        type: String
    },
    committee: [CommitteeSchema],
    canRegister: {
        type: String,
        default: "No",
        enum: ["Admin", "Departement", "Internal", "All", "External", "No"]
    },
    registered: [registeredSchema],
    createdAt: Date,
    updatedAt: Date
},
{
    timestamps: true
},
(schema) => {
    schema.plugin(mongooseAutoPopulate)
});