import { H3Event } from "h3";
import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { MemberModel } from "~~/server/models/MemberModel";
import Email from "~~/server/utils/mailTemplate";
import { IMember } from "~~/types";
import { IReqAgendaRegister } from "~~/types/IRequestPost";
import { IAgendaRegisterResponse, IError } from "~~/types/IResponse";
const config = useRuntimeConfig();
/**
 * Handles POST requests for registering a user to an event.
 * @param {H3Event} ev - The H3 event object.
 * @returns {Promise<Object>} The result of the registration operation.
 * @throws {H3Error} If an error occurs during the process.s
 */
export default defineEventHandler(
  async (ev): Promise<IAgendaRegisterResponse | IError> => {
    const { guest } = await readBody<IReqAgendaRegister>(ev);
    // Get the agenda ID from the query parameters
    const { id } = ev.context.params as { id: string };
    try {
      let email = "";
      let name = "";
      // Generate a new ID for the registration
      let participantId = new Types.ObjectId();
      // Find the agenda by ID
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda not found",
        });
      }

      const user = ev.context.user;
      if (user) {
        // Find the user member by NIM
        const me = await MemberModel.findOne({ NIM: user.member.NIM });

        if (!me) {
          throw createError({
            statusCode: 404,
            statusMessage: "User member not found",
          });
        }
        email = me.email;
        name = me.fullName;
        // Check if the user can register for the agenda
        const canRegister = agenda.canMeRegisterAsParticipant(
          user.member as IMember
        );
        if (!canRegister) {
          throw createError({
            statusCode: 403,
            statusMessage:
              "You do not have permission to register for this agenda",
          });
        }

        // Check if the user is already participant
        const isParticipant = agenda.participants?.some(
          (item) => (item.member as IMember).NIM == me.NIM
        );
        if (isParticipant) {
          throw createError({
            statusCode: 400,
            statusMessage: "You are already participant for this agenda",
          });
        }

        agenda.participants?.push({
          _id: participantId,
          member: me._id as Types.ObjectId,
        });
      } else {
        if (!guest) {
          throw createError({
            statusCode: 400,
            statusMessage: "Guest data is required",
          });
        }
        if (!agenda.canMeRegisterAsParticipant()) {
          throw createError({
            statusCode: 403,
            statusMessage: "Only public event can be participant by guest",
          });
        }
        agenda.participants?.push({
          _id: participantId,
          guest: {
            fullName: guest.fullName,
            email: guest.email,
            phone: guest.phone,
            NIM: guest.NIM,
            prodi: guest.prodi,
            class: guest.class,
            semester: guest.semester,
          },
        });
        email = guest.email;
        name = guest.fullName;
      }

      // Save the updated agenda
      const saved = await agenda.save();
      if (!saved) {
        throw createError({
          statusCode: 400,
          statusMessage: "Failed to save agenda registration",
        });
      }
      let sender = {
        email: `agenda@${config.mailtrap_domain}`,
        name: "Administrator",
      };
      const newMail = new Email({
        recipientName: name,
        emailTitle: `Agenda ${agenda.title} Registration Confirmation`,
        heroTitle: `Agenda ${agenda.title} Registration Confirmation`,
        heroSubtitle: `You have successfully registered for the agenda ${agenda.title}`,
        heroButtonLink: `${config.public.public_uri}/agendas/${agenda._id}/participant/register/?participantId=${participantId}`,
        heroButtonText: "View Registration Details",
        contentTitle1: "Agenda Registration Confirmation",
        contentParagraph1: `You have successfully registered for the agenda ${agenda.title}`,
        contentParagraph2: `You can view the agenda details by clicking the button below.`,
        contentTitle2: "Need help?",
        contentListItems: [],
        ctaTitle: "Need help?",
        ctaSubtitle: "Contact us at",
        ctaButtonLink: `${config.public.public_uri}/#contacts`,
        ctaButtonText: "Contact Us",
      });
      // Send an email confirmation to the user
      await sendEmail(
        sender,
        email,
        "Agenda Registration Confirmation",
        newMail.render(),
        "agenda-registration"
      );

      // Return success response
      return {
        statusCode: 200,
        statusMessage: `Successfully registered for agenda: ${agenda.title}`,
        data: {
          participantId: participantId,
        },
      };
    } catch (error: any) {
      // Handle any errors that occur during the process
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage:
          error.message ||
          "An unexpected error occurred during agenda registration",
      });
    }
  }
);
