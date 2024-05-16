import { defineMongooseModel } from '#nuxt/mongoose';
import mongooseAutopopulate from "mongoose-autopopulate";
import { IAddressSchema, IProfileSchema } from '~/types/ISchemas';
import { Schema } from "mongoose";

const AddressSchema = new Schema<IAddressSchema>({
    fullAddress: String,
    village: String,
    district: String,
    city: String,
    province: String,
    country: String,
    zip: Number,
})

export const ProfileModel = defineMongooseModel<IProfileSchema>("Profile", {
    NIM: {
        type: Number,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    birth: {
        type: {
            place: String,
            date: Date,
        },
        required: true
    },
    sex: {
        type: String,
        required: true,
        enum: ["female", "male"]
    },
    religion: {
        type: String,
        required: true
    },
    citizen: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: AddressSchema
    },
    isRegistered: {
        type: Boolean,
        required: true
    }
},
{
toJSON: {
    virtuals: true
},
toObject: {
    virtuals: true
}
},
(schema) => {
    schema.virtual('projects', {
        ref: "Project",
        localField: "_id",
        foreignField: "registered.profile",
        autopopulate: true
    });
    schema.virtual('events', {
        ref: "Event",
        localField: "_id",
        foreignField: "registered.profile",
        autopopulate: true
    });
    schema.plugin(mongooseAutopopulate);
});