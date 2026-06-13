import { cancelPayment } from "~~/server/utils/midtrans";
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

      if (registered.member) {
        if (!user.member || registered.member.toString() !== user.member._id.toString()) {
          throw createError({
            statusCode: 403,
            statusMessage: "Anda tidak memiliki izin membatalkan transaksi ini karena terdaftar pada akun member lain.",
          });
        }
      } else if (registered.guest) {
        if (!user.guest || registered.guest.toString() !== user.guest._id.toString()) {
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

      const cancel = await cancelPayment(transaction_id);
      if (cancel.status_code !== "200" && cancel.status_code !== "412" && cancel.status_code !== "404") {
        // 412 is "Merchant cannot modify status of the transaction" (already cancelled/settled)
        // 404 is transaction not found (might happen in sandbox or if already removed)
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
