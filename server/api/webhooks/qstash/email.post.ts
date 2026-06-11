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
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/participant?participantId=${participantId}`,
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
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/committee?committeeId=${committeeId}`,
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
  } else if (payload.type === "payment-success") {
    const { agendaTitle, agendaId, participantId, name, email, amount } = payload;
    const config = useRuntimeConfig();
    let sender = {
      email: config.resend_from,
      name: "Himatika Finance",
    };
    
    // Format mata uang rupiah
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);

    const newMail = new Email({
      recipientName: name,
      emailTitle: `Pembayaran Lunas: ${agendaTitle}`,
      heroTitle: `Pembayaran Berhasil! 💳`,
      heroSubtitle: `Pembayaran Anda sebesar ${formattedAmount} untuk acara "${agendaTitle}" telah kami terima.`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/participant?participantId=${participantId}`,
      heroButtonText: "Lihat E-Ticket Anda",
      contentTitle1: "E-Ticket Anda Sudah Aktif",
      contentParagraph1: `Terima kasih! Transaksi Anda telah berhasil diverifikasi oleh sistem. E-Ticket Anda kini sudah berstatus aktif dan siap digunakan.`,
      contentParagraph2: `Silakan klik tombol di bawah ini untuk melihat detail E-Ticket Anda. Tunjukkan QR Code pada tiket tersebut kepada panitia saat registrasi ulang di lokasi acara.`,
      contentTitle2: "Detail Transaksi",
      contentListItems: [
        `ID Peserta: ${participantId}`,
        `Total Pembayaran: ${formattedAmount}`,
        `Status: LUNAS`
      ],
      ctaTitle: "Kendala Teknis?",
      ctaSubtitle: "Jika Anda mengalami masalah dalam mengakses tiket, silakan hubungi kami.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Kami",
    });

    await sendEmail(
      sender,
      email,
      `[LUNAS] E-Ticket & Bukti Pembayaran: ${agendaTitle}`,
      newMail.render(),
      "payment-receipt"
    );
    return { success: true, type: payload.type };
  } else if (payload.type === "check-in-success") {
    const { agendaTitle, name, email, visitTime } = payload;
    const config = useRuntimeConfig();
    let sender = {
      email: config.resend_from,
      name: "Himatika Event Organizer",
    };

    const formattedTime = new Date(visitTime).toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMail = new Email({
      recipientName: name,
      emailTitle: `Terima Kasih Atas Partisipasi Anda: ${agendaTitle}`,
      heroTitle: `Terima Kasih Telah Hadir! ✨`,
      heroSubtitle: `Kehadiran Anda di acara "${agendaTitle}" sangat berkesan bagi kami.`,
      heroButtonLink: `${config.public.public_uri}`,
      heroButtonText: "Kunjungi Website Himatika",
      contentTitle1: "Halo,",
      contentParagraph1: `Terima kasih telah meluangkan waktu Anda untuk berpartisipasi dalam agenda **${agendaTitle}**. Kami mencatat bahwa Anda telah melakukan check-in pada **${formattedTime}**.`,
      contentParagraph2: `Kami berharap Anda mendapatkan pengalaman yang bermanfaat dan berharga dari acara ini. Dukungan Anda sangat memotivasi kami untuk terus menghadirkan kegiatan-kegiatan berkualitas di masa depan.`,
      contentTitle2: "Berikan Masukan Anda",
      contentListItems: [
        `Pendapat Anda sangat berharga untuk peningkatan kualitas acara kami.`,
        `Nantikan informasi mengenai sertifikat (jika ada) melalui portal acara.`
      ],
      ctaTitle: "Tetap Terhubung",
      ctaSubtitle: "Ikuti perkembangan event dan informasi terbaru dari kami.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Kami",
    });

    await sendEmail(
      sender,
      email,
      `Terima Kasih Telah Hadir di ${agendaTitle}`,
      newMail.render(),
      "event-attendance"
    );
    return { success: true, type: payload.type };
  }

  throw createError({ statusCode: 400, statusMessage: "Unknown payload type" });
});
