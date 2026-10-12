import mongoose from "mongoose";

/**
 * Serverless-safe MongoDB connection guard.
 *
 * Vercel freezes instances between invocations, which kills TCP sockets
 * mid-life, and cold-start connects can fail. The Nitro plugin only runs
 * once per instance start, so it cannot cover either case: every API
 * request must (cheaply) ensure a live connection before touching models.
 *
 * Design:
 * - `readyState === 1` fast path: pure sync check, no overhead.
 * - One shared in-flight attempt: assigned synchronously so concurrent
 *   callers reuse it instead of dialing MongoDB N times (Atlas M0 caps at
 *   500 connections).
 * - Stale handles (resolved promise + dead connection, e.g. after a
 *   freeze/thaw cycle) are discarded and replaced with a fresh attempt.
 * - Failures self-invalidate, so the next call retries instead of
 *   re-awaiting a dead promise. Callers let the error 500 and the client
 *   retries it as transient (never a logout).
 * - `bufferCommands` stays enabled with a short `bufferTimeoutMS`: queries
 *   survive brief reconnect windows instead of throwing instantly, but can
 *   never hang until the function timeout.
 */

const CONNECT_OPTIONS = {
  retryWrites: false, // Wajib false untuk standalone MongoDB (tanpa replica set)
  // Small pool: each serverless instance only needs a few concurrent
  // operations, and every pooled socket counts against the Atlas cap.
  maxPoolSize: 5,
  minPoolSize: 0,
  bufferCommands: true,
  bufferTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 20000,
};

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnAttempt: InflightAttempt | undefined;
}

interface InflightAttempt {
  promise: Promise<typeof mongoose>;
  /** True once the attempt finished (success or failure). */
  settled: boolean;
}

const getMongoConfig = (): { uri: string; dbName: string | undefined } => {
  try {
    const runtime = useRuntimeConfig() as unknown as Record<string, unknown>;
    if (typeof runtime?.mongodb_uri === "string" && runtime.mongodb_uri) {
      return {
        uri: runtime.mongodb_uri,
        dbName:
          typeof runtime.dbName === "string" ? runtime.dbName : undefined,
      };
    }
  } catch {
    // Outside the Nitro runtime (unit tests, scripts): fall through to env.
  }
  return {
    uri: process.env.HIMATIKA_MONGODB_URI as string,
    dbName: process.env.DBNAME,
  };
};

export const ensureDbConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  // Reuse the in-flight attempt when one exists and hasn't finished:
  // `readyState` alone can't be trusted (it stays 0 while connecting and
  // goes stale after a freeze/thaw kill), so settlement is tracked
  // explicitly. Assign synchronously so concurrent callers share it.
  let attempt = globalThis.__mongooseConnAttempt;
  if (!attempt || attempt.settled) {
    const { uri, dbName } = getMongoConfig();
    const current: InflightAttempt = {
      promise: mongoose.connect(uri, {
        ...CONNECT_OPTIONS,
        ...(dbName ? { dbName } : {}),
      }),
      settled: false,
    };
    globalThis.__mongooseConnAttempt = attempt = current;
    current.promise.then(
      () => {
        current.settled = true;
      },
      () => {
        current.settled = true;
        // Self-invalidate so the next call retries with a fresh attempt
        // instead of re-awaiting a dead one.
        if (globalThis.__mongooseConnAttempt === current) {
          globalThis.__mongooseConnAttempt = undefined;
        }
      }
    );
  }
  await attempt.promise;
};
