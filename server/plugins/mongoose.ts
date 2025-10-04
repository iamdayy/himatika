import mongoose from "mongoose";

/**
 * Runtime configuration object containing MongoDB connection details.
 */
const config = useRuntimeConfig();

/**
 * Nitro plugin to establish a MongoDB connection.
 * This plugin attempts to connect to the MongoDB database using the provided configuration.
 * It logs the success or failure of the connection attempt.
 */
export default defineNitroPlugin(async () => {
  try {
    // Attempt to connect to MongoDB using the configuration
    await mongoose.connect(config.mongodb_uri, {
      dbName: config.dbName,
    });

    console.log("DB connection established.");
  } catch (err) {
    console.error("DB connection failed.", err);
  }
});
