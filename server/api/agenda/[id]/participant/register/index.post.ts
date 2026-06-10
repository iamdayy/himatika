import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import Email from "~~/server/utils/mailTemplate";
import { generateQRCode } from "~~/server/utils/qrcode";
import { IAgenda, IUser } from "~~/types";
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
    email: config.resend_from,
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
        user as IUser | undefined
      );
      if (!canRegister) {
        throw createError({
          statusCode: 403,
          statusMessage:
            "You do not have permission to register for this agenda.",
        });
      }

      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const { GuestModel } = await import("~~/server/models/GuestModel");

      let participantId = new Types.ObjectId();
      let email: string = "";
      let name: string = "";
      
      let newParticipantData: any = {
        _id: participantId,
        agendaId: id,
      };

      if (user && user.member) {
        name = user.member.fullName;
        email = user.member.email;
        
        const isRegisteredCommittee = await CommitteeModel.exists({ agendaId: id, member: user.member._id });
        const isRegisteredParticipant = await ParticipantModel.exists({ agendaId: id, member: user.member._id });
        
        if (isRegisteredCommittee || isRegisteredParticipant) {
          throw createError({
            statusCode: 409,
            statusMessage: "You are already registered.",
          });
        }
        newParticipantData.member = user.member._id;
      } else if (user && user.guest) {
         const g = user.guest;
         name = g.fullName;
         email = g.email;

         const isRegisteredParticipant = await ParticipantModel.exists({ agendaId: id, guest: g._id });
         if (isRegisteredParticipant) {
          throw createError({
            statusCode: 409,
            statusMessage: "You are already registered.",
          });
         }
         newParticipantData.guest = g._id;
      } else if (guest) {
        name = guest.fullName;
        email = guest.email;
        
        const { MemberModel } = await import("~~/server/models/MemberModel");
        const existingMember = await MemberModel.findOne({ email: guest.email });
        
        if (existingMember) {
          throw createError({
            statusCode: 409,
            statusMessage: "Email ini terdaftar sebagai Mahasiswa (Member). Harap login terlebih dahulu.",
          });
        }
        
        let existingGuest = await GuestModel.findOne({ email: guest.email });
        if (existingGuest) {
          throw createError({
            statusCode: 409,
            statusMessage: "Email ini sudah terdaftar sebagai Guest. Harap login melalui Magic Link untuk mendaftar acara.",
          });
        }
        
        // If not found, create a new guest safely
        existingGuest = await GuestModel.create({
          fullName: guest.fullName,
          email: guest.email,
          phone: guest.phone,
          instance: guest.instance,
          NIM: guest.NIM,
          prodi: guest.prodi,
          class: guest.class,
          semester: guest.semester,
        });
        
        const isRegisteredParticipant = await ParticipantModel.exists({ agendaId: id, guest: existingGuest._id });
        if (isRegisteredParticipant) {
          throw createError({
            statusCode: 409,
            statusMessage: "You are already registered.",
          });
        }
        newParticipantData.guest = existingGuest._id;
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid registration data. Please login or provide guest details.",
        });
      }

      // Create Participant Record
      await ParticipantModel.create(newParticipantData);

      // Send confirmation email via QStash
      const { Client } = await import("@upstash/qstash");
      const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
      
      const config = useRuntimeConfig();
      const webhookUrl = `${config.public.public_uri}/api/webhooks/qstash/email`;
      
      qstashClient.publishJSON({
        url: webhookUrl,
        body: {
          type: "participant-registration",
          agendaTitle: agenda.title,
          agendaId: agenda._id,
          participantId: participantId,
          name: name,
          email: email
        }
      }).catch((e) => console.error("Failed to publish to QStash", e));

      return {
        statusCode: 200,
        statusMessage: `Successfully registered for agenda: ${agenda.title}`,
        data: {
          participantId: participantId,
        },
      };
    } catch (error: any) {
      console.log(error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage:
          error.statusMessage ||
          "An unexpected error occurred during agenda registration.",
      });
    }
  }
);
