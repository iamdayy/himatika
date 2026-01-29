import { Types } from "mongoose";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { ConfigModel } from "~~/server/models/ConfigModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { logAction } from "~~/server/utils/logger";
import { sendBulkEmail } from "~~/server/utils/mailer";
import Email from "~~/server/utils/mailTemplate";
import { broadcast } from "~~/server/utils/sse";
import { IAgenda, ICommittee, IQuestion } from "~~/types";
import { IError, IResponse } from "~~/types/IResponse";
/**
 * Handles PUT requests for updating an existing event.
 * @param {H3Event} ev - The H3 event object.
 * @returns {Promise<Object>} The result of the update operation.
 * @throws {H3Error} If an error occurs during the process.
 */
export default defineEventHandler(async (ev): Promise<IResponse | IError> => {
  try {
    // Ensure the user is authenticated and has the necessary permissions
    const user = ev.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!ev.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be admin / departement to use this endpoint",
      });
    }

    // Get the agenda ID from the query parameters
    const { id } = getQuery(ev);

    // Read and validate the request body
    const body = await readBody<IAgenda & { isPublish?: boolean, isDraft?: boolean, enableSubscription?: boolean }>(ev);

    // Find the agenda by ID
    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({
        statusCode: 404,
        statusMessage: "The agenda is not found",
      });
    }
    let committees: ICommittee[] | undefined = undefined;
    if (body.committees) {
      // Process committee members
      committees = await Promise.all(
        body.committees?.map(async (committee) => {
          try {
            const member = await MemberModel.findOne({ NIM: Number(committee.member) });
            if (!member) {
              return {
                job: committee.job,
                member: undefined,
                approved: false,
                approvedAt: undefined,
              };
            }
            return {
              job: committee.job,
              member: member._id as any,
              approved: committee.approved,
              approvedAt: committee.approvedAt,
            };
          } catch (error: any) {
            throw createError({
              statusCode: error.statusCode,
              message: error.message,
              data: error.data,
            });
          }
        })
      );
    }
    body.configuration.participant.questions = (
      agenda.configuration.participant.questions as IQuestion[]
    ).map((question) => question._id as Types.ObjectId);
    body.configuration.committee.questions = (
      agenda.configuration.committee.questions as IQuestion[]
    ).map((question) => question._id as Types.ObjectId);
    const saved = await agenda.updateOne({
      title: body.title,
      description: body.description,
      date: body.date,
      at: body.at,
      category: body.category,
      configuration: body.configuration,
      committees: committees,
    });
    if (!saved) {
      throw createError({
        statusCode: 400,
        statusMessage: "Failed to update the agenda",
      });
    }

    if (body.isPublish) {
      const t = await useTranslationServerMiddleware(ev);
      const config = useRuntimeConfig();

      let sender = {
        email: config.resend_from,
        name: "Administrator",
      };

      if (body.enableSubscription) {
        // Optimize Query: Select ONLY email, exclude _id. 
        // Drastically reduces memory usage (no full Mongoose documents)
        const emailPromise = (async () => {
             const members = await MemberModel.find({ status: "active" }).select("email -_id").lean();
             const emails = members.map((member: any) => ({ email: member.email }));

             const configuration = await ConfigModel.findOne().sort({ createdAt: -1 });
             // Fallback if config missing, though unlikely
             const orgName = configuration?.name || config.public.appname; 
             
             const emailBody = new Email({
               recipientName: t('emails.agenda.recipient_name'),
               emailTitle: t('emails.agenda.email_title', { orgName }),
               heroTitle: t('emails.agenda.hero_title', { agendaTitle: agenda.title, orgName }),
               heroSubtitle: t('emails.agenda.hero_subtitle'),
               heroButtonLink: `${config.public.public_uri}/agendas/${agenda._id}`,
               heroButtonText: t('emails.agenda.hero_button'),
               contentTitle1: t('emails.agenda.content_title'),
               contentParagraph1: "",
               contentAgendaDetails: {
                 description: agenda.description,
                 date: (() => {
                     const start = new Date(agenda.date.start);
                     const end = new Date(agenda.date.end);
                     const isSameDay = start.toDateString() === end.toDateString();
                     if (isSameDay) {
                         return `${start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                     } else {
                         return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                     }
                 })(),
                 location: agenda.at,
                 imageURL: agenda.photos && agenda.photos[0] ? `${config.public.public_uri}${agenda.photos[0].image}` : undefined
               },
               ctaTitle: t('emails.agenda.cta_title'),
               ctaSubtitle: t('emails.agenda.cta_subtitle'),
               ctaButtonText: t('emails.agenda.cta_button'),
               ctaButtonLink: `${config.public.public_uri}/agendas/${agenda._id}`,
               footerText: {
                 rights: t('emails.footer.rights'),
                 privacy: t('emails.footer.privacy'),
                 terms: t('emails.footer.terms'),
                 unsubscribeReason: t('emails.footer.unsubscribe_reason', { serviceName: orgName }),
                 unsubscribeAction: t('emails.footer.unsubscribe_action'),
                 here: t('emails.footer.here')
               }
             });
             
             await sendBulkEmail(
               sender,
               emails,
               emailBody.render(),
               t('emails.agenda.subject'),
               t('emails.agenda.category'),
               agenda.id
             );
        })();

        // If waitUntil is available (Nitro/Cloudflare/Vercel), use it.
        if (ev.waitUntil) {
             ev.waitUntil(emailPromise);
        } else {
             // Fallback for environments without waitUntil (just unawaited promise)
             // catch error to prevent unhandled rejection crashing process
             emailPromise.catch(console.error);
        }
      }

      broadcast('notification', {
        title: 'New Agenda',
        message: `${agenda.title} has been created.`,
        type: 'info',
        icon: 'i-heroicons-calendar',
        link: `/agendas`
      });
      
      // Audit Log
      logAction({
        action: 'CREATE',
        event: ev,
        target: `Agenda: ${agenda.title}`,
        details: { agendaId: agenda._id }
      });
    }

    // Update the agenda with the new data
    // Return success response
    return {
      statusCode: 200,
      statusMessage: `Agenda ${agenda.title} updated`,
      data: agenda._id,
    };
  } catch (error: any) {
    // Handle any errors that occur during the process
    return {
      statusCode: error.statusCode || 500,
      statusMessage:
        error.message ||
        "An unexpected error occurred while updating the agenda",
      data: error.data,
    };
  }
});
