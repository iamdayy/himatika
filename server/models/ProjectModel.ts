import { defineMongooseModel } from "#nuxt/mongoose";
import { IContributorSchema, IProjectSchema, IRegisteredSchema } from "~/types/ISchemas";
import { Schema } from "mongoose";
import { Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const contributorSchema = new Schema<IContributorSchema>({
    profile: {
        type: Types.ObjectId,
        required: true,
        ref: "Profile",
        autopopulate: true
    },
    job: {
        type: String,
        required: true
    }
});

const registeredSchema = new Schema<IRegisteredSchema>({
    profile: {
        type: Types.ObjectId,
        required: true,
        ref: "Profile",
        autopopulate: true
    },
    task: {
        type: String
    }
})

export const ProjectModel = defineMongooseModel<IProjectSchema>("Project", {
    title: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    canSee: {
        type: String,
        default: "All",
        enum: ["Admin", "Departement", "Internal", "All", "External", "No"]
    },
    contributors: {
        type: [contributorSchema],
        default: []
    },
    tasks: {
        type: Array<String>
    },
    canRegister: {
        type: String,
        default: "No",
        enum: ["Admin", "Departement", "Internal", "All", "External", "No"]
    },
    registered: [registeredSchema]
},
{

},
(schema) => {
    schema.plugin(mongooseAutoPopulate)
});