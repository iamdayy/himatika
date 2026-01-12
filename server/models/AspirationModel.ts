import { Schema, model } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IAspirationSchema } from "~~/types/ISchemas";

const AspirationSchema = new Schema<IAspirationSchema>(
  {
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      autopopulate: {
        select: "fullName email class semester avatar NIM",
      },
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    votes: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "Member",
          autopopulate: {
            select: "fullName email class semester avatar NIM",
          },
        },
        voteType: {
          type: String,
          enum: ["upvote", "downvote"],
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

AspirationSchema.plugin(mongooseAutoPopulate);

AspirationSchema.virtual("photos", {
  ref: "Photo",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});
AspirationSchema.virtual("videos", {
  ref: "Video",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});
AspirationSchema.virtual("docs", {
  ref: "Doc",
  localField: "_id",
  foreignField: "on",
  justOne: false,
});
AspirationSchema.virtual("proofs").get(function () {
  return {
    photos: this.photos,
    videos: this.videos,
    docs: this.docs,
  };
});

AspirationSchema.virtual("totalVotes").get(function () {
  // Recalculate total votes
  const upvotes =
    this.votes?.filter((vote) => vote.voteType === "upvote").length || 0;

  const downvotes =
    this.votes?.filter((vote) => vote.voteType === "downvote").length || 0;

  const totalVotes = upvotes - downvotes;

  return totalVotes > 0 ? totalVotes : 0;
});

export const AspirationModel = model<IAspirationSchema>(
  "Aspiration",
  AspirationSchema
);
