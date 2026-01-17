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
    const { job } = await readBody<IReqAgendaRegister>(ev);
    // Get the agenda ID from the query parameters
    const { id } = ev.context.params as { id: string };
    try {
      let email = "";
      let name = "";
      // Generate a new ID for the registration
      let committeeId = new Types.ObjectId();
      // Find the agenda by ID
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 404,
          statusMessage: "Agenda not found",
        });
      }
      if (!job) {
        throw createError({
          statusCode: 400,
          statusMessage: "Job is required",
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
        const canRegister = agenda.canMeRegisterAsCommittee(
          user.member as IMember
        );
        if (!canRegister) {
          throw createError({
            statusCode: 403,
            statusMessage:
              "You do not have permission to register for this agenda",
          });
        }

        // Check if the user is already committee
        const isCommittee = agenda.committees?.some(
          (item) => (item.member as IMember | undefined)?.NIM == me.NIM
        );
        if (isCommittee) {
          throw createError({
            statusCode: 400,
            statusMessage: "You are already committee for this agenda",
          });
        }

        // Check Job Availability
        const jobAvailables = agenda.configuration?.committee?.jobAvailables || [];
        const jobConfig = jobAvailables.find(
          (j) => j.label === job
        );
        if (jobConfig) {
          const currentCount = (agenda.committees || []).filter(
            (c) => c.job === job
          ).length;
          if (currentCount >= jobConfig.count) {
             throw createError({
              statusCode: 400,
              statusMessage: "This job position is full",
            });
          }
        }

      // Atomic Update: Push to committees ONLY if member is not already in it
      const result = await AgendaModel.updateOne(
        { 
          _id: id,
          "committees.member": { $ne: me._id } 
        },
        {
          $push: {
            committees: {
              _id: committeeId,
              job: job,
              member: me._id as Types.ObjectId,
              approved: false,
            },
          }
        }
      );

      if (result.modifiedCount === 0) {
          // Check if it failed because Agenda not found or User already committee
          // We know Agenda exists from the findById, so it must be the duplicate check
           throw createError({
            statusCode: 409,
            statusMessage: "You are already committee for this agenda",
          });
      }
      } else {
         throw createError({
            statusCode: 401,
            statusMessage: "You must be logged in to register as committee",
         });
      }

      // Fetch updated agenda to get details for email (or just use existing 'agenda' object which has title)
      // Note: 'agenda' object in memory is stale now regarding the new committee, but strictly for email text it's fine.
      
      let sender = {
        email: `agenda@${config.mailtrap_domain}`,
        name: "Administrator",
      };
      const newMail = new Email({
        recipientName: name,
        emailTitle: `Agenda ${agenda.title} Registration Confirmation`,
        heroTitle: `Agenda ${agenda.title} Registration Confirmation`,
        heroSubtitle: `You have successfully registered for the agenda ${agenda.title}`,
        heroButtonLink: `${config.public.public_uri}/agendas/${agenda._id}/committee/register/?committeeId=${committeeId}`,
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
          committeeId: committeeId,
        },
      };
    } catch (error: any) {
      // Handle any errors that occur during the process
      return {
        statusCode: error.statusCode || 500,
        statusMessage:
          error.message ||
          "An unexpected error occurred during agenda registration",
      };
    }
  }
);
