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
      const committee = agenda.committees?.find(
        (r) => r._id?.toString() === registeredId
      );

      if (!committee) {
        throw createError({
          statusCode: 400,
          statusMessage: "Committee registration not found",
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
        committee.payment?.expiry &&
        new Date(committee.payment.expiry) >= new Date()
      ) {
        return {
          statusCode: 200,
          statusMessage: "Payment found",
          data: { payment: committee.payment },
        };
      }

      // ✅ UBAH DISINI: Mengambil harga dari konfigurasi committee
      const ticketPrice = agenda.configuration.committee.amount || 0;

      // Hitung Admin Fee
      const adminFee = calculateAdminFee(ticketPrice, body.payment_method);
      const totalAmount = ticketPrice + adminFee;

      if (totalAmount <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid payment amount",
        });
      }

      // Request ke Midtrans
      const payment = await createCharge({
        payment_type: body.payment_method,
        bank_transfer: {
          bank: body.bank_transfer || "bca",
        },
        credit_card: body.credit_card,
        transaction_details: {
          order_id: registeredId,
          gross_amount: totalAmount, // ✅ Total + Admin
        },
        customer_details: {
          first_name:
            typeof committee.member === "object"
              ? (committee.member as IMember).fullName
              : "Committee Member",
          email:
            typeof committee.member === "object"
              ? (committee.member as IMember).email
              : "committee@example.com",
          phone:
            typeof committee.member === "object"
              ? (committee.member as IMember).phone || "0800000000"
              : "0800000000",
        },
      });

      // Simpan ke Database
      committee.payment = {
        ...committee.payment,
        status: "pending",
        // Mapping Method Baru
        method: body.payment_method,

        order_id: payment.order_id,
        transaction_id: payment.transaction_id,
        expiry: new Date(payment.expiry_time),
        time: new Date(payment.transaction_time),
        bank: payment.va_numbers?.[0]?.bank || body.bank_transfer || "midtrans",
        va_number: payment.va_numbers?.[0]?.va_number || "",
      };

      await agenda.save();

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
