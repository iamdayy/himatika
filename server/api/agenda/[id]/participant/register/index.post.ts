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

      const nimToCheck = user ? user.member.NIM : guest?.NIM;
      const isAlreadyParticipant = agenda.participants?.some(
        (p) =>
          (p.member as IMember)?.NIM === nimToCheck ||
          p.guest?.NIM === nimToCheck
      );

      if (isAlreadyParticipant) {
        throw createError({
          statusCode: 409,
          statusMessage: "You are already a participant in this agenda.",
        });
      }

      const participantId = new Types.ObjectId();
      let updateQuery = {};
      let email: string, name: string;

      if (user) {
        name = user.member.fullName;
        email = user.member.email;
        updateQuery = {
          $addToSet: {
            // Atomic operation: hanya tambah jika belum ada
            participants: {
              _id: participantId,
              member: user.member._id,
            },
          },
        };
      } else if (guest) {
        name = guest.fullName;
        email = guest.email;
        updateQuery = {
          $addToSet: {
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
        // This case should theoretically not be reached due to earlier checks
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid registration data.",
        });
      }

      // Eksekusi update langsung ke DB
      const result = await AgendaModel.updateOne({ _id: id }, updateQuery);

      // Cek apakah ada dokumen yang dimodifikasi
      if (result.modifiedCount === 0) {
        // Jika 0, berarti kemungkinan besar user sudah terdaftar (karena $addToSet menolak duplikat)
        // atau Agenda tidak ditemukan (sudah dicek di awal sih)
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
