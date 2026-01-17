import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import Email from "~~/server/utils/mailTemplate";
import { generateQRCode } from "~~/server/utils/qrcode";
import { IAgenda, IMember } from "~~/types";
import { IAgendaRegisterResponse, IError } from "~~/types/IResponse";

/**
 * Sends a confirmation email to the user after successful registration for an agenda.
 * The email includes a QR code for the participant to use for check-in or verification.
 *
 * @param agenda - The agenda object for which the user has registered.
 * @param participantId - The unique ID generated for the new participant.
 * @param name - The name of the recipient.
 * @param email - The email address of the recipient.
 */
async function sendConfirmationEmail(
  agenda: IAgenda,
  participantId: Types.ObjectId,
  name: string,
  email: string
) {
  const config = useRuntimeConfig();
  const sender = {
    email: `agenda@${config.mailtrap_domain}`,
    name: "Administrator",
  };

  const qrCodeDataUrl = await generateQRCode(participantId.toString());
  const newMail = new Email({
    recipientName: name,
    emailTitle: `Pendaftaran Agenda ${agenda.title} Berhasil!`,
    heroTitle: `Selamat, Anda Terdaftar!`,
    heroSubtitle: `Anda telah berhasil terdaftar dalam agenda "${agenda.title}". Kami sangat senang Anda bergabung!`,
    heroButtonLink: `${config.public.public_uri}/agendas/${agenda._id}/participant/register/?participantId=${participantId}`,
    heroButtonText: "Lihat Detail Pendaftaran",
    contentTitle1: "Detail Pendaftaran Anda",
    contentParagraph1: `Berikut adalah QR Code unik Anda untuk agenda "${agenda.title}". Mohon simpan dan tunjukkan QR Code ini saat registrasi ulang di lokasi acara.`,
    contentParagraph2:
      "Anda juga dapat melihat detail pendaftaran Anda kapan saja dengan mengklik tombol di bawah ini.",
    contentTitle2: "Butuh Bantuan?",
    contentListItems: [],
    ctaTitle: "Ada Pertanyaan?",
    ctaSubtitle:
      "Jangan ragu untuk menghubungi kami jika Anda memerlukan bantuan.",
    ctaButtonLink: `${config.public.public_uri}/#contacts`,
    ctaButtonText: "Hubungi Kami",
    qrCodeDataUrl: qrCodeDataUrl,
  });

  await sendEmail(
    sender,
    email,
    "Agenda Registration Confirmation",
    newMail.render(),
    "agenda-registration"
  );
}

export default defineEventHandler(
  async (ev): Promise<IAgendaRegisterResponse | IError> => {
    try {
      const { guest } = await readBody(ev);
      const { id } = ev.context.params as { id: string };
      const user = ev.context.user;

      if (!user && !guest) {
        throw createError({
          statusCode: 400,
          statusMessage: "Authentication or guest data is required.",
        });
      }

      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda not found.",
        });
      }

      const canRegister = agenda.canMeRegisterAsParticipant(
        user?.member as IMember | undefined
      );
      if (!canRegister) {
        throw createError({
          statusCode: 403,
          statusMessage:
            "You do not have permission to register for this agenda.",
        });
      }

      const participantId = new Types.ObjectId();
      let updateQuery: any = {};
      let conditionQuery: any = { _id: id };
      let email: string, name: string;

      if (user) {
        name = user.member.fullName;
        email = user.member.email;
        // Condition: User must NOT be in participants list
        conditionQuery["participants.member"] = { $ne: user.member._id };
        
        updateQuery = {
          $push: {
            participants: {
              _id: participantId,
              member: user.member._id,
            },
          },
        };
      } else if (guest) {
        name = guest.fullName;
        email = guest.email;
        // Condition: Guest NIM must NOT be in participants list
        conditionQuery["participants.guest.NIM"] = { $ne: guest.NIM };

        updateQuery = {
          $push: {
            participants: {
              _id: participantId,
              guest: {
                fullName: guest.fullName,
                email: guest.email,
                phone: guest.phone,
                NIM: guest.NIM,
                prodi: guest.prodi,
                class: guest.class,
                semester: guest.semester,
                instance: guest.instance,
              },
            },
          },
        };
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid registration data.",
        });
      }

      // Execute atomic update
      const result = await AgendaModel.updateOne(conditionQuery, updateQuery);

      // Check if document was modified
      if (result.modifiedCount === 0) {
        // If 0, it means either:
        // 1. Agenda not found (checked earlier, unlikely)
        // 2. Condition failed (User already registered)
        throw createError({
          statusCode: 409,
          statusMessage: "You are already registered or Agenda not found.",
        });
      }
      // Send confirmation email
      await sendConfirmationEmail(agenda, participantId, name, email);

      return {
        statusCode: 200,
        statusMessage: `Successfully registered for agenda: ${agenda.title}`,
        data: {
          participantId: participantId,
        },
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage:
          error.statusMessage ||
          "An unexpected error occurred during agenda registration.",
      });
    }
  }
);
