import { Receiver } from "@upstash/qstash";
import Email from "~~/server/utils/mailTemplate";

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, "upstash-signature");
  if (!signature) {
    throw createError({ statusCode: 400, statusMessage: "Missing signature" });
  }

  const rawBody = await readRawBody(event);
  
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
  });

  try {
    const isValid = await receiver.verify({
      signature,
      body: rawBody || "",
    });
    if (!isValid) {
      throw createError({ statusCode: 401, statusMessage: "Invalid signature" });
    }
  } catch (err: any) {
    throw createError({ statusCode: 401, statusMessage: err.message });
  }

  // Parse the verified body
  const payload = JSON.parse(rawBody || "{}");
  
  if (payload.type === "participant-registration") {
    const { agendaTitle, agendaId, participantId, name, email } = payload;
    const config = useRuntimeConfig();
    let sender = {
      email: config.resend_from,
      name: "Himatika Event Organizer",
    };
    const newMail = new Email({
      recipientName: name,
      emailTitle: `Pendaftaran Berhasil: ${agendaTitle}`,
      heroTitle: `Pendaftaran Berhasil! 🎉`,
      heroSubtitle: `Pendaftaran Anda untuk acara "${agendaTitle}" telah berhasil dikonfirmasi.`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/participant/register/?participantId=${participantId}`,
      heroButtonText: "Lihat E-Ticket & Detail Acara",
      contentTitle1: "Halo,",
      contentParagraph1: `Terima kasih telah mendaftar di acara **${agendaTitle}**. Kami sangat antusias menyambut kehadiran Anda! Silakan klik tombol di bawah ini untuk melihat detail pendaftaran, kode QR, serta panduan acara Anda.`,
      contentParagraph2: `Jika acara ini memerlukan biaya pendaftaran, mohon selesaikan pembayaran Anda melalui tautan portal untuk mengamankan kursi Anda.`,
      contentTitle2: "Informasi Penting",
      contentListItems: [
        `ID Pendaftaran: ${participantId}`,
        `Cek jadwal acara melalui halaman resmi agenda.`,
        `Siapkan kode QR Anda dari portal saat melakukan check-in.`
      ],
      ctaTitle: "Ada Pertanyaan?",
      ctaSubtitle: "Tim kami siap membantu Anda.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Kami",
    });

    await sendEmail(
      sender,
      email,
      `Pendaftaran Berhasil: ${agendaTitle}`,
      newMail.render(),
      "agenda-registration"
    );
    return { success: true, type: payload.type };
  } else if (payload.type === "committee-registration") {
    const { agendaTitle, agendaId, committeeId, name, email } = payload;
    const config = useRuntimeConfig();
    let sender = {
      email: config.resend_from,
      name: "Himatika Event Organizer",
    };
    const newMail = new Email({
      recipientName: name,
      emailTitle: `Pendaftaran Panitia: ${agendaTitle}`,
      heroTitle: `Selamat Bergabung di Tim! 🤝`,
      heroSubtitle: `Pendaftaran kepanitiaan Anda untuk acara "${agendaTitle}" telah kami terima.`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/committee/register/?committeeId=${committeeId}`,
      heroButtonText: "Lihat Portal Panitia",
      contentTitle1: "Halo Rekan Panitia,",
      contentParagraph1: `Terima kasih atas kesediaan Anda untuk berkontribusi sebagai panitia di **${agendaTitle}**. Dedikasi Anda sangat berarti untuk kesuksesan acara ini!`,
      contentParagraph2: `Silakan klik tombol di bawah ini untuk mengakses portal panitia Anda. Di sana, Anda dapat mengecek status persetujuan (approval) dan deskripsi tugas yang diberikan. Tim inti kami akan segera menghubungi Anda untuk instruksi lebih lanjut.`,
      contentTitle2: "Langkah Selanjutnya",
      contentListItems: [
        `ID Kepanitiaan: ${committeeId}`,
        `Mohon tunggu persetujuan dari koordinator pelaksana jika status Anda masih pending.`,
        `Pelajari detail acara dan tugas yang akan Anda jalankan.`
      ],
      ctaTitle: "Butuh Bantuan?",
      ctaSubtitle: "Jangan ragu menghubungi tim penyelenggara inti.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Kami",
    });

    await sendEmail(
      sender,
      email,
      `Pendaftaran Panitia: ${agendaTitle}`,
      newMail.render(),
      "committee-registration"
    );
    return { success: true, type: payload.type };
  }

  throw createError({ statusCode: 400, statusMessage: "Unknown payload type" });
});
