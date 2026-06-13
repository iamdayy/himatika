import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params as { id: string };
    const body = await readBody<{ registeredId: string, status: 'success' | 'failed' }>(event);

    if (!body.registeredId || !['success', 'failed'].includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid request body" });
    }

    const agenda = await AgendaModel.findById(id);
    if (!agenda) {
      throw createError({ statusCode: 404, statusMessage: "Agenda not found" });
    }

    let registration = await ParticipantModel.findById(body.registeredId).populate("member").populate("guest");
    let isCommittee = false;

    if (!registration) {
      registration = await CommitteeModel.findById(body.registeredId).populate("member") as any;
      isCommittee = true;
    }

    if (!registration) {
      throw createError({ statusCode: 404, statusMessage: "Registration not found" });
    }

    if (!registration.payment || registration.payment.method !== "manual_transfer") {
      throw createError({ statusCode: 400, statusMessage: "This registration does not use manual transfer" });
    }

    registration.payment = {
      ...registration.payment,
      status: body.status,
    } as any;

    await registration.save();

    if (body.status === 'success') {
      const { Client } = await import("@upstash/qstash");
      const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
      const config = useRuntimeConfig();

      const customerName = registration.member ? (registration.member as any).fullName : (registration.guest as any)?.fullName || "";
      const customerEmail = registration.member ? (registration.member as any).email : (registration.guest as any)?.email || "";

      qstashClient.publishJSON({
        url: `${config.public.public_uri}/api/webhooks/qstash/email`,
        body: {
          type: "payment-success",
          agendaTitle: agenda.title,
          agendaId: agenda._id,
          participantId: body.registeredId,
          name: customerName,
          email: customerEmail,
          amount: registration.payment.amount,
        },
      }).catch((e) => console.error("Failed to publish manual payment-success", e));
    }

    return {
      statusCode: 200,
      statusMessage: "Payment verified successfully",
      data: { payment: registration.payment },
    };
  } catch (error: any) {
    console.error(error);
    return createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Internal Server Error",
    });
  }
});
