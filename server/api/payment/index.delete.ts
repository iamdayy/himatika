import { cancelPayment, getTransactionStatus } from "~~/server/utils/midtrans";
import { resolveMemberId } from "~~/server/utils/agendaAuth";
import { IReqPaymentQuery } from "~~/types/IRequestPost";
import { IError, IResponse } from "~~/types/IResponse";

export default defineEventHandler(
  async (event): Promise<IResponse | IError> => {
    const { transaction_id } = getQuery<IReqPaymentQuery>(event);
    try {
      const user = event.context.user;
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: "Sesi Anda telah berakhir atau tidak valid. Silakan login atau akses kembali melalui Magic Link.",
        });
      }

      const { ParticipantModel } = await import("~~/server/models/ParticipantModel");
      const { CommitteeModel } = await import("~~/server/models/CommitteeModel");

      let registered: any = await ParticipantModel.findOne({
        "payment.transaction_id": transaction_id,
      });

      if (!registered) {
        registered = await CommitteeModel.findOne({
          "payment.transaction_id": transaction_id,
        });
      }

      if (!registered || !registered.payment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Transaksi pembayaran yang ingin Anda batalkan tidak dapat ditemukan. Pembayaran mungkin sudah dibatalkan sebelumnya.",
        });
      }

      // Ownership — resolve member id from the DB: fresh access tokens do not
      // carry member._id, and comparing an undefined id crashed with a 500.
      if (registered.member) {
        const memberId = await resolveMemberId(user);
        const registeredMemberId =
          typeof registered.member === "object" && registered.member !== null
            ? String((registered.member as any)._id)
            : String(registered.member);
        if (!memberId || registeredMemberId !== memberId) {
          throw createError({
            statusCode: 403,
            statusMessage: "Anda tidak memiliki izin membatalkan transaksi ini karena terdaftar pada akun member lain.",
          });
        }
      } else if (registered.guest) {
        const sessionGuestId =
          typeof user.guest === "string"
            ? user.guest
            : String((user.guest as any)?._id ?? "");
        const registeredGuestId =
          typeof registered.guest === "object" && registered.guest !== null
            ? String((registered.guest as any)._id)
            : String(registered.guest);
        if (!sessionGuestId || registeredGuestId !== sessionGuestId) {
           throw createError({
            statusCode: 403,
            statusMessage: "Anda tidak memiliki izin membatalkan transaksi ini karena terdaftar pada akun guest lain.",
          });
        }
      } else {
        throw createError({
          statusCode: 403,
          statusMessage: "Anda tidak memiliki akses untuk membatalkan transaksi ini.",
        });
      }

      // A settled payment must never be locally cancelled.
      if (registered.payment.status === "success") {
        throw createError({
          statusCode: 409,
          statusMessage: "Transaksi ini sudah dibayar dan tidak dapat dibatalkan.",
        });
      }

      const cancel = await cancelPayment(transaction_id);
      if (cancel.status_code === "200") {
        // Genuinely cancelled upstream — proceed with local cleanup below.
      } else if (cancel.status_code === "412" || cancel.status_code === "407") {
        // Midtrans refuses modification: the transaction already settled or
        // expired. Reconcile against the authoritative status instead of
        // blindly marking it canceled while money was captured.
        const authoritative = await getTransactionStatus(transaction_id);
        if (authoritative === "success") {
          registered.payment = { ...registered.payment, status: "success" } as any;
          await registered.save();
          throw createError({
            statusCode: 409,
            statusMessage: "Transaksi ini sudah dibayar dan tidak dapat dibatalkan.",
          });
        }
        if (authoritative !== "canceled" && authoritative !== "expired") {
          throw createError({
            statusCode: 409,
            statusMessage: "Midtrans menolak pembatalan untuk transaksi ini. Hubungi panitia jika masalah berlanjut.",
            data: { message: cancel.status_message },
          });
        }
        // canceled/expired upstream → fall through to local cleanup.
      } else if (cancel.status_code !== "404") {
        // 404 = unknown/removed transaction; treat like a successful no-op cancel.
        throw createError({
          statusCode: 500,
          statusMessage: "Sistem gagal membatalkan transaksi pada sistem Midtrans. Kemungkinan transaksi ini sudah kedaluwarsa atau telah dibayar. Hubungi panitia jika masalah berlanjut.",
          data: { message: cancel.status_message },
        });
      }
      registered.payment = {
        ...registered.payment,
        status: "canceled",
        transaction_id: "",
        order_id: "",
        bank: "",
        expiry: undefined,
      };
      await registered.save();
      return {
        statusCode: 200,
        statusMessage: "Transaksi dibatalkan",
      };
    } catch (error: any) {
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || "Terjadi kesalahan sistem saat mencoba membatalkan pembayaran Anda. Silakan coba beberapa saat lagi.",
        data: error.data,
      });
    }
  }
);
