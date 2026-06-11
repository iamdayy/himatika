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
          statusMessage: "Agenda not found",
        });
      }

      // ✅ UBAH DISINI: Mencari di array committees
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
      const committee = await CommitteeModel.findById(registeredId).populate("member");
      if (!committee || committee.agendaId.toString() !== id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Committee not found",
        });
      }
      if (committee.payment?.status === "success") {
        throw createError({
          statusCode: 400,
          statusMessage: "Payment already completed",
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
          statusMessage: "Invalid payment amount",
        });
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
        statusMessage: error.statusMessage || "Internal server error",
      });
    }
  }
);
