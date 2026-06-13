import { Receiver } from "@upstash/qstash";
import Email from "~~/server/utils/mailTemplate";
import { sendEmail } from "~~/server/utils/mailer";

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

  const payload = JSON.parse(rawBody || "{}");
  const config = useRuntimeConfig();
  const sender = {
    email: config.resend_from,
    name: "Himatika Event Management",
  };
  
  if (payload.type === "participant-registration") {
    const { agendaTitle, agendaId, participantId, name, email } = payload;
    const newMail = new Email({
      recipientName: name,
      emailTitle: `Konfirmasi Pendaftaran: ${agendaTitle}`,
      heroTitle: `Pendaftaran Berhasil Diverifikasi`,
      heroSubtitle: `Pendaftaran Anda untuk agenda "${agendaTitle}" telah tercatat dalam sistem kami.`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/participant?participantId=${participantId}`,
      heroButtonText: "Akses Portal Peserta",
      contentTitle1: "Yth. Bapak/Ibu/Saudara/i,",
      contentParagraph1: `Kami mengucapkan terima kasih atas partisipasi Anda dalam **${agendaTitle}**. Pendaftaran Anda telah kami verifikasi dengan sukses. Silakan gunakan tautan portal peserta di bawah ini untuk mengakses informasi lebih lanjut mengenai agenda ini.`,
      contentParagraph2: `Apabila agenda ini mensyaratkan biaya registrasi, kami mengimbau agar Anda segera menyelesaikan proses pembayaran melalui portal untuk mengamankan keikutsertaan Anda.`,
      contentTitle2: "Informasi Registrasi",
      contentListItems: [
        `Nomor Registrasi: ${participantId}`,
        `Jadwal dan lokasi acara dapat diakses secara berkala melalui portal.`,
        `Mohon persiapkan QR Code E-Ticket Anda saat melakukan registrasi ulang di lokasi.`
      ],
      ctaTitle: "Layanan Dukungan Terpadu",
      ctaSubtitle: "Jika Anda membutuhkan bantuan atau informasi tambahan, tim layanan kami siap membantu.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Layanan Dukungan",
    });

    await sendEmail(sender, email, `Konfirmasi Pendaftaran: ${agendaTitle}`, newMail.render(), "agenda-registration");
    return { success: true, type: payload.type };
  } 
  else if (payload.type === "committee-registration") {
    const { agendaTitle, agendaId, committeeId, name, email } = payload;
    const newMail = new Email({
      recipientName: name,
      emailTitle: `Pendaftaran Kepanitiaan: ${agendaTitle}`,
      heroTitle: `Pendaftaran Kepanitiaan Diterima`,
      heroSubtitle: `Berkas pendaftaran Anda untuk kepanitiaan "${agendaTitle}" telah masuk ke dalam sistem kami.`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/committee?committeeId=${committeeId}`,
      heroButtonText: "Akses Portal Panitia",
      contentTitle1: "Yth. Calon Panitia,",
      contentParagraph1: `Kami mengapresiasi minat dan kesediaan Anda untuk berkontribusi dalam penyelenggaraan **${agendaTitle}**. Formulir pendaftaran kepanitiaan Anda saat ini sedang dalam peninjauan oleh koordinator pelaksana.`,
      contentParagraph2: `Anda dapat memantau status persetujuan serta rincian penugasan melalui portal panitia. Mohon pastikan seluruh data yang Anda unggah telah valid.`,
      contentTitle2: "Tahapan Selanjutnya",
      contentListItems: [
        `ID Kepanitiaan: ${committeeId}`,
        `Menunggu persetujuan (approval) dari pengurus inti acara.`,
        `Pelajari dengan saksama uraian tugas (job description) yang akan diberikan.`
      ],
      ctaTitle: "Pusat Bantuan",
      ctaSubtitle: "Untuk pertanyaan lebih lanjut terkait proses rekrutmen, silakan hubungi narahubung kami.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Koordinator",
    });

    await sendEmail(sender, email, `Pendaftaran Kepanitiaan: ${agendaTitle}`, newMail.render(), "committee-registration");
    return { success: true, type: payload.type };
  } 
  else if (payload.type === "payment-pending") {
    const { agendaTitle, agendaId, participantId, name, email, amount, method, bank, va_number, qris_png, expiry, isCommittee } = payload;
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);
    const formattedExpiry = new Date(expiry).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let paymentInstruction = `Silakan selesaikan pembayaran menggunakan metode ${method?.toUpperCase()} melalui tautan pembayaran pada portal Anda.`;
    if (["bank_transfer", "echannel", "permata"].includes(method)) {
      paymentInstruction = `Mohon lakukan transfer melalui Virtual Account ${bank?.toUpperCase()} ke nomor **${va_number}**.`;
    } else if (method === "qris") {
      paymentInstruction = `Silakan pindai (scan) kode QRIS di bawah ini atau melalui portal Anda menggunakan aplikasi pembayaran elektronik pilihan Anda.`;
    } else if (method === "manual_transfer") {
      paymentInstruction = `Mohon lakukan transfer secara manual ke rekening tujuan panitia berikut: **${va_number}**. Setelah melakukan transfer, harap **unggah bukti pembayaran** melalui portal untuk dapat kami verifikasi.`;
    }

    const newMail = new Email({
      recipientName: name,
      emailTitle: `Menunggu Pembayaran: ${agendaTitle}`,
      heroTitle: `Instruksi Pembayaran Tagihan`,
      heroSubtitle: `Terdapat tagihan sebesar ${formattedAmount} yang menunggu penyelesaian untuk agenda "${agendaTitle}".`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/${isCommittee ? 'committee' : 'participant'}?${isCommittee ? 'committeeId' : 'participantId'}=${participantId}`,
      heroButtonText: "Tinjau Detail Tagihan",
      contentTitle1: "Rincian Instruksi Pembayaran",
      contentParagraph1: `Yth. Bapak/Ibu/Saudara/i, pendaftaran Anda untuk **${agendaTitle}** hampir selesai. ${paymentInstruction}`,
      contentParagraph2: `Untuk menghindari pembatalan otomatis oleh sistem, kami mohon agar Anda segera menyelesaikan pembayaran ini sebelum batas tenggat waktu pada **${formattedExpiry}**. Tiket elektronik (E-Ticket) akan diterbitkan segera setelah pembayaran terverifikasi secara otomatis.`,
      contentTitle2: "Informasi Tagihan",
      contentListItems: [
        `Nomor Referensi: ${participantId}`,
        `Total Tagihan: ${formattedAmount}`,
        `Batas Kedaluwarsa: ${formattedExpiry}`
      ],
      qrCodeDataUrl: method === "qris" ? qris_png : undefined,
      ctaTitle: "Kendala Transaksi?",
      ctaSubtitle: "Jika Anda mengalami kesulitan saat melakukan transaksi, layanan dukungan kami selalu siap mendampingi Anda.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Layanan Finansial",
    });

    await sendEmail(sender, email, `[Menunggu Pembayaran] Tagihan Registrasi: ${agendaTitle}`, newMail.render(), "payment-pending");
    return { success: true, type: payload.type };
  }
  else if (payload.type === "payment-success") {
    const { agendaTitle, agendaId, participantId, name, email, amount } = payload;
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);

    const newMail = new Email({
      recipientName: name,
      emailTitle: `Kuitansi & E-Ticket: ${agendaTitle}`,
      heroTitle: `Pembayaran Terverifikasi`,
      heroSubtitle: `Pembayaran sebesar ${formattedAmount} untuk agenda "${agendaTitle}" telah tervalidasi.`,
      heroButtonLink: `${config.public.public_uri}/agendas/${agendaId}/participant?participantId=${participantId}`,
      heroButtonText: "Unduh / Akses E-Ticket",
      contentTitle1: "Penerbitan Tiket Elektronik",
      contentParagraph1: `Yth. Bapak/Ibu/Saudara/i, kami dengan senang hati menginformasikan bahwa transaksi Anda telah berhasil kami terima dan verifikasi. Sebagai konfirmasi resmi, E-Ticket Anda kini telah aktif.`,
      contentParagraph2: `E-Ticket beserta barcode dapat diakses kapan saja melalui portal peserta. Mohon tunjukkan E-Ticket tersebut kepada petugas kami saat melakukan proses kedatangan (check-in) di lokasi penyelenggaraan acara.`,
      contentTitle2: "Bukti Transaksi (Kuitansi Digital)",
      contentListItems: [
        `Nomor Referensi Peserta: ${participantId}`,
        `Jumlah Terbayar: ${formattedAmount}`,
        `Status Pembayaran: LUNAS`
      ],
      ctaTitle: "Dukungan Teknis",
      ctaSubtitle: "Apabila E-Ticket Anda tidak dapat diakses, mohon hubungi kami dengan melampirkan email ini.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Pusat Resolusi Masalah",
    });

    await sendEmail(sender, email, `[LUNAS] E-Ticket Aktif: ${agendaTitle}`, newMail.render(), "payment-receipt");
    return { success: true, type: payload.type };
  } 
  else if (payload.type === "check-in-success") {
    const { agendaTitle, name, email, visitTime } = payload;
    const formattedTime = new Date(visitTime).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newMail = new Email({
      recipientName: name,
      emailTitle: `Apresiasi Kehadiran: ${agendaTitle}`,
      heroTitle: `Apresiasi Partisipasi Anda`,
      heroSubtitle: `Terima kasih atas dedikasi dan kehadiran Anda pada agenda "${agendaTitle}".`,
      heroButtonLink: `${config.public.public_uri}`,
      heroButtonText: "Kunjungi Situs Resmi",
      contentTitle1: "Yth. Bapak/Ibu/Saudara/i,",
      contentParagraph1: `Atas nama komite penyelenggara, kami mengucapkan terima kasih yang sebesar-besarnya atas kehadiran Anda pada agenda **${agendaTitle}**. Sistem kami telah mencatat kehadiran resmi Anda pada **${formattedTime}**.`,
      contentParagraph2: `Kami berharap acara ini memberikan wawasan, nilai, serta pengalaman profesional yang berharga bagi Anda. Dukungan serta partisipasi aktif Anda sangat bermakna bagi peningkatan kualitas program kerja kami selanjutnya.`,
      contentTitle2: "Evaluasi & Tindak Lanjut",
      contentListItems: [
        `Masukan Anda sangat krusial bagi evaluasi mutu layanan penyelenggaraan acara kami.`,
        `Informasi pendistribusian sertifikat (apabila tersedia) akan diumumkan melalui portal peserta.`
      ],
      ctaTitle: "Jalin Relasi Terbuka",
      ctaSubtitle: "Mari terus terhubung untuk menjajaki berbagai peluang kolaborasi di masa mendatang.",
      ctaButtonLink: `${config.public.public_uri}/#contacts`,
      ctaButtonText: "Hubungi Layanan Kemitraan",
    });

    await sendEmail(sender, email, `Apresiasi Kehadiran - ${agendaTitle}`, newMail.render(), "event-attendance");
    return { success: true, type: payload.type };
  }

  throw createError({ statusCode: 400, statusMessage: "Unknown payload type" });
});
