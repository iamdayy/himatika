import { defineMongooseModel } from '#nuxt/mongoose'
export const UserModel = defineMongooseModel("User", {
    name: {
        type: String,
        required: true,
    }
})