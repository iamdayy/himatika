// server/plugins/mongoose.ts
import mongoose from "mongoose";

const config = useRuntimeConfig();

// Serverless instances (Vercel) are ephemeral: every cold start runs this
// plugin, and opening a fresh connection pool per instance exhausts the
// Atlas M0 500-connection cap under load. Cache the connecting promise in
// global scope so warm instances reuse the existing connection instead of
// dialing MongoDB again.
declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnPromise: Promise<typeof mongoose> | undefined;
}

export default defineNitroPlugin(async () => {
  // @ts-ignore
  if (import.meta.prerender || process.env.npm_lifecycle_event === "build") {
    console.log("Skipping DB connection during build/prerender phase.");
    return;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      return; // Gunakan koneksi yang sudah ada
    }
    if (!globalThis.__mongooseConnPromise) {
      globalThis.__mongooseConnPromise = mongoose.connect(config.mongodb_uri, {
        dbName: config.dbName,
        retryWrites: false, // Wajib false untuk standalone MongoDB (tanpa replica set)
        // Small pool: each serverless instance only needs a few concurrent
        // operations, and every pooled socket counts against the Atlas cap.
        maxPoolSize: 5,
        minPoolSize: 0,
        // Fail fast instead of buffering until the function times out: on
        // Vercel a hanging connect would turn every auth request into a
        // 504, and the client treats that as "logged out".
        bufferCommands: false,
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
      });
    }
    await globalThis.__mongooseConnPromise;
    console.log("DB connection established.");
  } catch (err) {
    // Drop the rejected promise so the next invocation retries with a
    // fresh connect instead of re-awaiting a dead one.
    globalThis.__mongooseConnPromise = undefined;
    console.error("DB connection failed.", err);
  }
});
