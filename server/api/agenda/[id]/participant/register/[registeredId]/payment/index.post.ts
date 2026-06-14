import { AgendaModel } from "~~/server/models/AgendaModel";
import { createCharge } from "~~/server/utils/midtrans";
import { IPaymentBody } from "~~/types/IRequestPost";
import { IError, IPaymentResponse } from "~~/types/IResponse";
// --- KONFIGURASI BIAYA ADMIN (Sesuaikan dengan Dashboard Midtrans) ---
const FEES = {
  VA: 4000, // Virtual Account (BCA, BNI, BRI, Mandiri, Permata) usually Rp 4.000 - Rp 5.000
  QRIS: 0.007, // QRIS usually 0.7%
  EWALLET: 0.02, // GoPay/ShopeePay usually 2%
  CREDIT_CARD_PCT: 0.029, // CC Percentage 2.9%
  CREDIT_CARD_FIX: 2000, // CC Fixed fee Rp 2.000
};
// Helper function hitung admin fee
const calculateAdminFee = (amount: number, type: string): number => {
  // 1. Virtual Account (Fixed)
  if (["bank_transfer", "echannel", "permata"].includes(type)) {
    return FEES.VA;
  }

  // 2. QRIS (Percentage)
  if (type === "qris") {
    // Math.ceil untuk pembulatan ke atas agar tidak koma
    return Math.ceil(amount * FEES.QRIS);
  }

  // 3. E-Wallet (Percentage)
  if (["gopay", "shopeepay"].includes(type)) {
    return Math.ceil(amount * FEES.EWALLET);
  }

  // 4. Credit Card (Percentage + Fixed)
  if (type === "credit_card") {
    return Math.ceil(amount * FEES.CREDIT_CARD_PCT) + FEES.CREDIT_CARD_FIX;
  }

  return 0; // Default 0
};
export default defineEventHandler(
  async (ev): Promise<IPaymentResponse | IError> => {
    try {
      const { id, registeredId } = ev.context.params as {
        id: string;
        registeredId: string;
      };
      const body = await readBody<IPaymentBody>(ev);
      const agenda = await AgendaModel.findById(id);
      if (!agenda) {
        throw createError({
          statusCode: 400,
          statusMessage: "Acara atau agenda yang Anda tuju tidak ditemukan.",
        });
      }
      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      const participant = await ParticipantModel.findById(registeredId).populate("member").populate("guest");
      if (!participant || participant.agendaId.toString() !== id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Data pendaftaran peserta Anda tidak ditemukan. Silakan ulangi proses pendaftaran.",
        });
      }
      if (participant.payment?.status === "success") {
        throw createError({
          statusCode: 400,
          statusMessage: "Pembayaran untuk pendaftaran ini sudah berhasil diselesaikan. Anda tidak dapat membuat tagihan baru.",
        });
      }
      if (
        participant.payment?.status === "pending" &&
        new Date(participant.payment?.expiry as Date) >= new Date()
      ) {
        return {
          statusCode: 200,
          statusMessage: "Payment found",
          data: {
            payment: participant.payment,
          },
        };
      }
      // --- LOGIC HARGA BARU ---
      // Resolve harga tiket: jika peserta memilih ticketModel, gunakan harga dari model tersebut
      let ticketPrice = agenda.configuration?.participant?.amount || 0;
      if (participant.ticketModelId) {
        const ticketModels = agenda.configuration?.participant?.ticketModels || [];
        const selectedModel = ticketModels.find((m: any) => m._id?.toString() === participant.ticketModelId);
        if (selectedModel) {
          ticketPrice = selectedModel.price;
        }
      }

      // Hitung Admin Fee berdasarkan tipe pembayaran yang dipilih user
      const adminFee = calculateAdminFee(ticketPrice, body.payment_method);

      // Total yang harus dibayar user ke Midtrans
      const totalAmount = ticketPrice + adminFee;

      // Validasi agar total tidak 0 atau negatif
      if (totalAmount <= 0) {
        // Jika gratis (Rp 0), mungkin langsung bypass status success?
        // Tapi disini kita throw error dulu
        throw createError({
          statusCode: 400,
          statusMessage: "Total tagihan pembayaran tidak valid (Rp 0). Harap periksa kembali detail tagihan Anda atau hubungi panitia.",
        });
      }
      if (body.payment_method === "manual_transfer") {
        const manualTarget = agenda.configuration?.manualPayments?.find((m: any) => m._id?.toString() === body.manual_target);

        participant.payment = {
          ...participant.payment,
          status: "pending",
          method: "manual_transfer",
          order_id: registeredId,
          transaction_id: `MANUAL-${Date.now()}`,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          time: new Date(),
          bank: manualTarget?.name || "manual",
          va_number: manualTarget?.account || "",
          qris_png: "",
          amount: totalAmount,
          manual_target: body.manual_target || "",
          biller_code: manualTarget?.owner || "",
        } as any;
        await participant.save();

        // Publish manual payment-pending to QStash
        const { Client } = await import("@upstash/qstash");
        const qstashClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
        const config = useRuntimeConfig();
        
        const customerName = participant.member ? (participant.member as any).fullName : (participant.guest as any)?.fullName || "";
        const customerEmail = participant.member ? (participant.member as any).email : (participant.guest as any)?.email || "";

        qstashClient.publishJSON({
          url: `${config.public.public_uri}/api/webhooks/qstash/email`,
          body: {
            type: "payment-pending",
            agendaTitle: agenda.title,
            agendaId: agenda._id,
            participantId: registeredId,
            name: customerName,
            email: customerEmail,
            amount: totalAmount,
            method: "manual_transfer",
            bank: "manual",
            va_number: body.manual_target || "",
            qris_png: "",
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isCommittee: false
          },
        }).catch((e) => console.error("Failed to publish manual payment-pending", e));

        return {
          statusCode: 200,
          statusMessage: "Manual payment created",
          data: {
            payment: participant.payment,
          },
        };
      }

      const payment = await createCharge({
        payment_type: body.payment_method,
        bank_transfer: {
          bank: body.bank_transfer || "bca",
        },
        credit_card: body.credit_card,
        transaction_details: {
          order_id: registeredId,
          gross_amount: totalAmount,
        },
        customer_details: {
          first_name:
            participant.member
              ? (participant.member as any).fullName
              : (participant.guest as any)?.fullName || "",
          email:
            participant.member
              ? (participant.member as any).email
              : (participant.guest as any)?.email || "",
          phone:
            participant.member
              ? (participant.member as any).phone || ""
              : (participant.guest as any)?.phone || "",
        },
      });
      // ✅ UPDATE: Logic penyimpanan ke DB
      participant.payment = {
        ...participant.payment,
        status: "pending",
        method: body.payment_method,
        order_id: payment.order_id,
        transaction_id: payment.transaction_id,
        expiry: new Date(payment.expiry_time),
        time: new Date(payment.transaction_time),
        bank: payment.va_numbers?.[0]?.bank || body.bank_transfer || "midtrans",
        amount: totalAmount,
        va_number: payment.va_numbers?.[0]?.va_number || "",
        qris_png: payment.actions?.[1]?.url,
      };

      await participant.save();

      // Publish payment-pending to QStash
      const { Client } = await import("@upstash/qstash");
      const qstashClient = new Client({
        token: process.env.QSTASH_TOKEN || "",
      });

      const config = useRuntimeConfig();
      const webhookUrl = `${config.public.public_uri}/api/webhooks/qstash/email`;

      const customerName = participant.member
        ? (participant.member as any).fullName
        : (participant.guest as any)?.fullName || "";
        
      const customerEmail = participant.member
        ? (participant.member as any).email
        : (participant.guest as any)?.email || "";

      qstashClient
        .publishJSON({
          url: webhookUrl,
          body: {
            type: "payment-pending",
            agendaTitle: agenda.title,
            agendaId: agenda._id,
            participantId: registeredId,
            name: customerName,
            email: customerEmail,
            amount: totalAmount,
            method: body.payment_method,
            bank: payment.va_numbers?.[0]?.bank || body.bank_transfer || "midtrans",
            va_number: payment.va_numbers?.[0]?.va_number || "",
            qris_png: payment.actions?.[1]?.url || "",
            expiry: new Date(payment.expiry_time).toISOString(),
            isCommittee: false
          },
        })
        .catch((e) => console.error("Failed to publish payment-pending to QStash", e));

      return {
        statusCode: 200,
        statusMessage: "Payment created",
        data: {
          payment: participant.payment,
        },
      };
    } catch (error: any) {
      console.error("Error creating payment:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Terjadi kesalahan pada server saat mencoba membuat tagihan pembayaran. Silakan coba beberapa saat lagi.",
      });
    }
  }
);
