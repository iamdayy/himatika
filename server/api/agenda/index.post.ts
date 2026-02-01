import { AgendaModel } from "~~/server/models/AgendaModel";
import { ConfigModel } from "~~/server/models/ConfigModel";
import { MemberModel } from "~~/server/models/MemberModel";
import { logAction } from "~~/server/utils/logger";
import { sendBulkEmail } from "~~/server/utils/mailer";
import Email from "~~/server/utils/mailTemplate";
import { broadcast } from "~~/server/utils/sse";
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
          statusMessage: "Anda harus login untuk menggunakan endpoint ini",
        });
      }
      if (!event.context.organizer) {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda harus menjadi admin / departemen untuk menggunakan endpoint ini",
        });
      }

      // Read and validate the request body
      const body = await readBody<IReqAgenda & { isDraft?: boolean }>(event);

      if (!body.title) {
        throw createError({
          statusCode: 400,
          message: "Judul harus diisi",
          data: { message: "Judul harus diisi", path: "title" },
        });
      }

      if (!body.description) {
        throw createError({
          statusCode: 400,
          message: "Deskripsi harus diisi",
          data: { message: "Deskripsi harus diisi", path: "description" },
        });
      }

      if (!body.date) {
        throw createError({
          statusCode: 400,
          message: "Tanggal harus diisi",
          data: { message: "Tanggal harus diisi", path: "date" },
        });
      }

      if (!body.at) {
        throw createError({
          statusCode: 400,
          message: "Lokasi harus diisi",
          data: { message: "Lokasi harus diisi", path: "at" },
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
        title: body.title,
        description: body.description,
        date: body.date,
        at: body.at,
        category: body.category,
        configuration: body.configuration,
        committees: committees ? await Promise.all(committees) : [],
      });
      // Save the new agenda
      const savedAgenda = await newAgenda.save();
      if (!savedAgenda) {
        throw createError({
          statusCode: 400,
          message: "Gagal menyimpan agenda",
        });
      }
      let sender = {
        email: config.resend_from,
        name: "Administrator",
      };
      // email bulk
      if (body.enableSubscription && !body.isDraft) {
        // Use event.waitUntil for background processing (Serverless friendly)
        // This allows the response to be sent immediately while email sending continues
        const t = await useTranslationServerMiddleware(event);
        
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
               heroTitle: t('emails.agenda.hero_title', { agendaTitle: savedAgenda.title, orgName }),
               heroSubtitle: t('emails.agenda.hero_subtitle'),
               heroButtonLink: `${config.public.public_uri}/agendas/${savedAgenda._id}`,
               heroButtonText: t('emails.agenda.hero_button'),
               contentTitle1: t('emails.agenda.content_title'),
               contentParagraph1: "",
               contentAgendaDetails: {
                 description: savedAgenda.description,
                 date: (() => {
                     const start = new Date(savedAgenda.date.start);
                     const end = new Date(savedAgenda.date.end);
                     const isSameDay = start.toDateString() === end.toDateString();
                     if (isSameDay) {
                         return `${start.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                     } else {
                         return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                     }
                 })(),
                 location: savedAgenda.at,
                 imageURL: savedAgenda.photos && savedAgenda.photos[0] ? `${config.public.public_uri}${savedAgenda.photos[0].image}` : undefined
               },
               ctaTitle: t('emails.agenda.cta_title'),
               ctaSubtitle: t('emails.agenda.cta_subtitle'),
               ctaButtonText: t('emails.agenda.cta_button'),
               ctaButtonLink: `${config.public.public_uri}/agendas/${savedAgenda._id}`,
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
               newAgenda.id
             );
        })();

        // If waitUntil is available (Nitro/Cloudflare/Vercel), use it.
        if (event.waitUntil) {
             event.waitUntil(emailPromise);
        } else {
             // Fallback for environments without waitUntil (just unawaited promise)
             // catch error to prevent unhandled rejection crashing process
             emailPromise.catch(console.error);
        }
      }
      
      // Broadcast notification
      if (!body.isDraft) {
        broadcast('notification', {
          title: 'Agenda Baru',
          message: `${savedAgenda.title} telah berhasil dibuat.`,
          type: 'info',
          icon: 'i-heroicons-calendar',
          link: `/agendas`
        });
      }

      // Audit Log
      logAction({
        action: 'CREATE',
        event,
        target: `Agenda: ${savedAgenda.title}`,
        details: { agendaId: savedAgenda._id }
      });

      return {
        statusCode: 200,
        statusMessage: "Agenda berhasil dibuat",
        data: savedAgenda._id,
      };
    } catch (error: any) {
      return {
        statusCode: error.statusCode || 500,
        statusMessage: error.message || "Terjadi kesalahan yang tidak terduga",
        data: error.data,
      };
    }
  }
);
