import mongoose, { Schema } from "mongoose";
import { createError } from "h3";
import { IResponse } from "~~/types/IResponse";

/**
 * Cross-instance rate limiting backed by MongoDB.
 *
 * The nuxt-security limiter uses an in-process LRU cache, which multiplies
 * the effective limit by the number of serverless instances on Vercel.
 * This helper stores counters in Mongo so every instance shares one bucket,
 * with zero additional dependencies. A TTL index garbage-collects old windows.
 */

export interface IRateLimitSchema {
  _id: string;
  count: number;
  updatedAt: Date;
}

const rateLimitSchema = new Schema<IRateLimitSchema>(
  {
    _id: { type: String, required: true },
    count: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// GC: windows never outlive 15 minutes.
rateLimitSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 900 });

export const RateLimitModel =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimitSchema>("RateLimit", rateLimitSchema);

/**
 * Throws a 429 when `key` exceeds `max` hits inside `windowMs`.
 * Atomic: the conditional update is the gate — no read-check-write race.
 */
export const enforceRateLimit = async (
  key: string,
  max: number,
  windowMs: number
): Promise<void> => {
  const windowStart = new Date(Date.now() - windowMs);
  const rejected = () =>
    createError({
      statusCode: 429,
      statusMessage: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
    });

  try {
    const doc = await RateLimitModel.findOneAndUpdate(
      {
        _id: key,
        $or: [{ updatedAt: { $lt: windowStart } }, { count: { $lt: max } }],
      },
      [
        {
          $set: {
            // Fresh window restarts at 1; otherwise increment.
            count: {
              $cond: [{ $gt: ["$updatedAt", windowStart] }, { $add: ["$count", 1] }, 1],
            },
            updatedAt: "$$NOW",
          },
        },
      ],
      // Mongoose 9 requires explicit opt-in for aggregation-pipeline updates.
      { upsert: true, returnDocument: "after", updatePipeline: true }
    );

    if (!doc) throw rejected();
    return;
  } catch (error: any) {
    // Budget exhausted: the filter didn't match and upsert collided with the
    // existing row (E11000). Two racers losing the very first insert also
    // land here — give them one chance to consume a remaining slot.
    const isDupKey =
      error?.code === 11000 || error?.codeName === "DuplicateKey";
    if (!isDupKey) throw error;

    const lateIncrement = await RateLimitModel.updateOne(
      { _id: key, updatedAt: { $gt: windowStart }, count: { $lt: max } },
      { $inc: { count: 1 } }
    );
    if (lateIncrement.modifiedCount === 1) return;
    throw rejected();
  }
};
