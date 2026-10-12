// server/plugins/mongoose.ts
import { ensureDbConnection } from "../utils/db";

export default defineNitroPlugin(async () => {
  // @ts-ignore
  if (import.meta.prerender || process.env.npm_lifecycle_event === "build") {
    console.log("Skipping DB connection during build/prerender phase.");
    return;
  }

  try {
    // Warm the shared connection at instance startup. Mid-life drops
    // (freeze/thaw) and cold-start failures are covered per-request by the
    // ensureDbConnection() guard in the auth middleware, so a failure here
    // must not take the instance down.
    await ensureDbConnection();
    console.log("DB connection established.");
  } catch (err) {
    console.error("DB connection failed.", err);
  }
});
