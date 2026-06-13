import { AgendaModel } from "~~/server/models/AgendaModel";
import { createCharge } from "~~/server/utils/midtrans";
import { IMember } from "~~/types";
import { IPaymentBody } from "~~/types/IRequestPost";
import { IError, IPaymentResponse } from "~~/types/IResponse";

// --- KONFIGURASI BIAYA ADMIN (Sama dengan Participant) ---
const FEES = {
  VA: 4000,
  QRIS: 0.007,
  EWALLET: 0.02,
  CREDIT_CARD_PCT: 0.029,
  CREDIT_CARD_FIX: 2000,
};

// Helper: Hitung Admin Fee
const calculateAdminFee = (amount: number, type: string): number => {
  if (["bank_transfer", "echannel", "permata"].includes(type)) {
    return FEES.VA;
  }
  if (type === "qris") {
    return Math.ceil(amount * FEES.QRIS);
  }
  if (["gopay", "shopeepay"].includes(type)) {
    return Math.ceil(amount * FEES.EWALLET);
  }
  if (type === "credit_card") {
    return Math.ceil(amount * FEES.CREDIT_CARD_PCT) + FEES.CREDIT_CARD_FIX;
  }
  return 0;
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

      // ✅ UBAH DISINI: Mencari di array committees
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const committee = await CommitteeModel.findById(registeredId).populate("member");
      if (!committee || committee.agendaId.toString() !== id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Data kepanitiaan Anda tidak ditemukan. Silakan ulangi proses pendaftaran.",
        });
      }
      if (committee.payment?.status === "success") {
        throw createError({
          statusCode: 400,
          statusMessage: "Pembayaran untuk kepanitiaan ini sudah berhasil diselesaikan. Anda tidak dapat membuat tagihan baru.",
        });
      }
      if (
        committee.payment?.status === "pending" &&
        new Date(committee.payment?.expiry as Date) >= new Date()
      ) {
        return {
          statusCode: 200,
          statusMessage: "Payment found",
          data: {
            payment: committee.payment,
          },
        };
      }
      // --- LOGIC HARGA BARU ---
      const ticketPrice = agenda.configuration?.committee?.amount || 0;

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
        committee.payment = {
          ...committee.payment,
          status: "pending",
          method: "manual_transfer",
          order_id: registeredId,
          transaction_id: `MANUAL-${Date.now()}`,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          time: new Date(),
          bank: "manual",
          va_number: "",
          qris_png: "",
          manual_target: body.manual_target || "",
        } as any;
        await committee.save();

        return {
          statusCode: 200,
          statusMessage: "Manual payment created",
          data: {
            payment: committee.payment,
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
          first_name: committee.member ? (committee.member as IMember).fullName : "",
          email: committee.member ? (committee.member as IMember).email : "",
          phone: committee.member ? (committee.member as IMember).phone || "" : "",
        },
      });
      // ✅ UPDATE: Logic penyimpanan ke DB
      committee.payment = {
        ...committee.payment,
        status: "pending",
        method: body.payment_method,
        order_id: payment.order_id,
        transaction_id: payment.transaction_id,
        expiry: new Date(payment.expiry_time),
        time: new Date(payment.transaction_time),
        bank: payment.va_numbers?.[0]?.bank || body.bank_transfer || "midtrans",
        va_number: payment.va_numbers?.[0]?.va_number || "",
        qris_png: payment.actions?.[1]?.url,
      };

      await committee.save();

      // Publish payment-pending to QStash
      const { Client } = await import("@upstash/qstash");
      const qstashClient = new Client({
        token: process.env.QSTASH_TOKEN || "",
      });

      const config = useRuntimeConfig();
      const webhookUrl = `${config.public.public_uri}/api/webhooks/qstash/email`;

      const customerName = committee.member ? (committee.member as IMember).fullName : "";
      const customerEmail = committee.member ? (committee.member as IMember).email : "";

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
            isCommittee: true
          },
        })
        .catch((e) => console.error("Failed to publish payment-pending to QStash", e));

      return {
        statusCode: 200,
        statusMessage: "Payment created",
        data: {
          payment: committee.payment,
        },
      };
    } catch (error: any) {
      console.error("Error creating committee payment:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Terjadi kesalahan pada server saat mencoba membuat tagihan pembayaran. Silakan coba beberapa saat lagi.",
      });
    }
  }
);
