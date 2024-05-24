import mongoose from "mongoose";
const config = useRuntimeConfig();
export default defineNitroPlugin(async () => {
  try {
    await mongoose.connect(config.public.mongodb_uri, {
      dbName: config.public.dbName,
    });
    console.log("DB connection established.");
  } catch (err) {
    console.error("DB connection failed.", err);
  }
});
