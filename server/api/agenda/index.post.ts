import { AgendaModel } from "~~/server/models/AgendaModel";
import { ConfigModel } from "~~/server/models/ConfigModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { sendBulkEmail } from "~~/server/utils/mailer";
import Email from "~~/server/utils/mailTemplate";
import { IReqAgenda } from "~~/types/IRequestPost";
import { IError, IResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();
/**
 * Handles POST requests for creating a new event.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Event>} The newly created event.
 * @throws {H3Error} If an error occurs during the process.
 */
export default defineEventHandler(
  async (event): Promise<(IResponse & { data?: string }) | IError> => {
    try {
      // Ensure the user is authenticated and has the necessary permissions
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be logged in to use this endpoint",
        });
      }
      if (!event.context.organizer) {
        throw createError({
          statusCode: 403,
          statusMessage: "You must be admin / departement to use this endpoint",
        });
      }

      // Read and validate the request body
      const body = await readBody<IReqAgenda>(event);

      if (!body.title) {
        throw createError({
          statusCode: 400,
          message: "Title is required",
          data: { message: "Title is required", path: "title" },
        });
      }

      if (!body.description) {
        throw createError({
          statusCode: 400,
          message: "Description is required",
          data: { message: "Description is required", path: "description" },
        });
      }

      if (!body.date) {
        throw createError({
          statusCode: 400,
          message: "Date is required",
          data: { message: "Date is required", path: "date" },
        });
      }

      if (!body.at) {
        throw createError({
          statusCode: 400,
          message: "Location is required",
          data: { message: "Location is required", path: "at" },
        });
      }

      // Process committee members
      const committees = body.committees?.map(async (committee) => {
        try {
          return {
            job: committee.job,
            member: await findMemberByNim(committee.member as number),
            approved: committee.approved,
            approvedAt: committee.approvedAt,
          };
        } catch (error: any) {
          return {
            job: committee.job,
            member: null,
            approved: false,
            approvedAt: null,
          };
        }
      });
      // Check if questions are provided and process them

      // Create a new agenda
      const newAgenda = new AgendaModel({
        ...body,
        committees: await Promise.all(committees!),
      });
      // Save the new agenda
      const savedAgenda = await newAgenda.save();
      if (!savedAgenda) {
        throw createError({
          statusCode: 400,
          message: "Failed to save the agenda",
        });
      }
      let sender = {
        email: `agenda@${config.mailtrap_domain}`,
        name: "Administrator",
      };
      // email bulk
      const members = await MemberModel.find({ status: "active" });
      const emails = members.map((member) => {
        return {
          email: member.email,
        };
      });
      const configurations = await ConfigModel.find();
      const configuration = configurations[configurations.length - 1];
      if (body.enableSubscription) {
        const emailBody = new Email({
          recipientName: "Kawan Tika",
          emailTitle: `Psst... Ada Agenda Seru Nih di ${configuration.name}`,
          heroTitle: `${savedAgenda.title} - ${configuration.name}`,
          heroSubtitle: `Ada agenda seru baru nih!`,
          heroButtonLink: `${config.public.public_uri}/agendas/${savedAgenda._id}`,
          heroButtonText: "Lihat Detail",
          contentTitle1: `Ada agenda seru baru nih! Jangan sampai kelewatan ya!`,
          contentParagraph1: `
          <ul>
            <li><strong>Deskripsi:</strong> ${savedAgenda.description}</li>
            <li><strong>Tanggal:</strong> ${savedAgenda.date}</li>
            <li><strong>LoKasi:</strong> ${savedAgenda.at}</li>
          </ul>
            `,
          ctaTitle: `Klik di sini untuk melihat detailnya!`,
          ctaSubtitle: `Sampai jumpa di acara!`,
          ctaButtonText: "Lihat Detail",
          ctaButtonLink: `${config.public.public_uri}/agendas/${savedAgenda._id}`,
        });
        await sendBulkEmail(
          sender,
          emails,
          emailBody.render(),
          "Agenda Baru!",
          "Pemberitahuan Agenda Baru",
          newAgenda.id
        );
      }

      return {
        statusCode: 200,
        statusMessage: "Agenda created",
        data: savedAgenda._id,
      };
    } catch (error: any) {
      return {
        statusCode: error.statusCode || 500,
        statusMessage: error.message || "An unexpected error occurred",
        data: error.data,
      };
    }
  }
);
