import { model, Schema, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { IDoc, IMember } from "~~/types";
import type {
  IDocSchema,
  IRequestSignSchema,
  ITrailSchema,
} from "~~/types/ISchemas";
import Email from "../utils/mailTemplate";
import SignModel from "./SignModel";

const requestsSignSchema = new Schema<IRequestSignSchema>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "Member",
    required: true,
    autopopulate: {
      select: "fullName NIM avatar email",
    },
  },
  signed: {
    type: Boolean,
    default: false,
  },
  as: {
    type: String,
    required: true,
  },
  sign: {
    type: Schema.Types.ObjectId,
    ref: SignModel,
    required: false,
    autopopulate: true,
  },
  signedAt: {
    type: Date,
    default: null,
  },
  signedIp: {
    type: String,
    default: null,
  },
});
const trailSchema = new Schema<ITrailSchema>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      autopopulate: {
        select: "fullName NIM avatar email",
      },
    },
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "SIGN",
        "ARCHIVE",
        "UNARCHIVE",
        "APPROVE",
        "REJECT",
      ], // Replace with actual values of the Action enum
      default: "CREATE",
    },
    actionAt: {
      type: Date,
      default: Date.now,
    },
    actionIp: {
      type: String,
    },
    doc: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
const docSchema = new Schema<IDocSchema>(
  {
    label: { type: String, required: true },
    doc: { type: String, required: true },
    no: { type: String, required: true },
    tags: { type: [String], required: true },
    uploader: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      autopopulate: {
        select: "fullName NIM email avatar",
      },
    },
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    on: {
      type: Types.ObjectId,
      required: false,
      refPath: "onModel",
    },
    signs: {
      type: [requestsSignSchema],
      required: false,
    },
    onModel: {
      type: String,
      enum: ["Project", "Agenda", "Aspiration"],
      required: false,
    },
    trails: {
      type: [trailSchema],
      required: false,
    },
  },
  { timestamps: true }
);
docSchema.plugin(mongooseAutoPopulate);
docSchema.post("save", async function (doc) {
  if (!doc) return;
  if (doc.signs) {
    const config = useRuntimeConfig();
    await Promise.all(
      doc.signs.map(async (sign) => {
        const user = sign.user as IMember;
        const mailText = new Email({
          recipientName: user.fullName,
          emailTitle: "New Document for Signature",
          heroTitle: "New Document for Signature",
          heroSubtitle: "You have a new document that requires your signature.",
          heroButtonLink: `${config.public.public_uri}/signatures/${doc._id}`,
          heroButtonText: "Sign Document",
          contentTitle1: "Document Details",
          contentParagraph1: `Document Label: ${doc.label}`,
          contentParagraph2: `Document Number: '${doc.no}'`,
          ctaTitle: "Need help?",
          ctaSubtitle: "Contact us at",
          ctaButtonLink: `${config.public.public_uri}/#contacts`,
          ctaButtonText: "Contact Us",
        });
        await sendEmail(
          {
            name: config.public.appname,
            email: `signature@${config.mailtrap_domain}`,
          },
          user.email,
          `New document ${doc.label} needs your signature`,
          mailText.render(),
          "New Document for Signature"
        );
      })
    );
  }
});
docSchema.post("findOneAndUpdate", async function (doc: IDoc) {
  const config = useRuntimeConfig();
  if (!doc) return;
  if (!doc.signs) return;
  if (doc.signs.filter((sign) => sign.signed).length == doc.signs.length) {
    await sendEmail(
      {
        name: config.public.appname,
        email: `signature@${config.mailtrap_domain}`,
      },
      (doc.uploader as IMember).email,
      `Dokumen ${doc.label} telah ditandatangani`,
      new Email({
        recipientName: (doc.uploader as IMember).fullName,
        emailTitle: `Dokumen ${doc.label} telah ditandatangani`,
        heroTitle: `Dokumen ${doc.label} telah ditandatangani`,
        heroSubtitle: `Dokumen ${doc.label} telah ditandatangani oleh semua pihak yang terlibat. Silakan unduh dokumen tersebut di bawah ini.`,
        heroButtonText: "Unduh Dokumen",
        heroButtonLink: `${config.public.public_uri}${doc.doc}`,
        contentTitle1: "Detail Dokumen",
        contentParagraph1: `Label Dokumen: ${doc.label}`,
        contentParagraph2: `No: '${doc.no}'`,
        contentTitle2: "Di tandatangani oleh: ",
        contentListItems: [
          ...doc.signs.map((sign) => {
            return `${(sign.user as IMember).fullName} (${sign.as})`;
          }),
        ],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      }).render(),
      "Document Signed"
    );
  }
});

export const DocModel = model<IDocSchema>("Doc", docSchema);
