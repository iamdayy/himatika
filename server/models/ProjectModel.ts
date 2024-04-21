import { defineMongooseModel } from "#nuxt/mongoose";
import { IContributorSchema, IProjectSchema } from "~/types/ISchemas";
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
    hidden: {
        type: Boolean,
        default: false,
    },
    contributors: {
        type: [contributorSchema],
        default: []
    }
},
{

},
(schema) => {
    schema.plugin(mongooseAutoPopulate)
});