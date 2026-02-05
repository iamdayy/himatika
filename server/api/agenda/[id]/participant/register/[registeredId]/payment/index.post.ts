import { AgendaModel } from "~~/server/models/AgendaModel";
import { createCharge } from "~~/server/utils/midtrans";
import { IMember } from "~~/types";
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
          statusMessage: "Agenda not found",
        });
      }
      const participant = agenda.participants?.find(
        (r) => r._id?.toString() === registeredId
      );
      if (!participant) {
        throw createError({
          statusCode: 400,
          statusMessage: "Participant not found",
        });
      }
      if (participant.payment?.status === "success") {
        throw createError({
          statusCode: 400,
          statusMessage: "Payment already completed",
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
      const ticketPrice = agenda.configuration.participant.amount || 0;

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
          first_name:
            typeof participant.member === "object"
              ? (participant.member as IMember).fullName
              : participant.guest?.fullName || "",
          email:
            typeof participant.member === "object"
              ? (participant.member as IMember).email
              : participant.guest?.email || "",
          phone:
            typeof participant.member === "object"
              ? (participant.member as IMember).phone || ""
              : participant.guest?.phone || "",
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
        va_number: payment.va_numbers?.[0]?.va_number || "",
        qris_png: payment.actions?.[1]?.url,
      };

      await agenda.save();
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
        statusMessage: error.statusMessage || "Internal server error",
      });
    }
  }
);
