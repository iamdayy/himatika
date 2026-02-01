import crypto from "crypto";
import { TPaymentStatus } from "~~/types";
const config = useRuntimeConfig();

export interface IChargeResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status: string;
  actions: {
    name: string;
    method: string;
    url: string;
  }[];
  qr_string: string;
  acquirer: string;
  expiry_time: string;
  va_numbers: [
    {
      bank: string;
      va_number: string;
    }
  ];
}

export interface IChargeRequestBody {
  payment_type: string;
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
  customer_details: {
    first_name: string;
    email: string;
    phone: string;
  };
  custom_expiry?: {
    expiry_duration: number;
    unit: string;
  };
  metadata?: {};
  bank_transfer?: {
    bank: string;
  };
  credit_card?: {
    token_id: string;
  };
}

const generateRandomString = (length: number): string => {
  return crypto.randomBytes(length).toString("hex");
};

export const createCharge = async (
  body: IChargeRequestBody
): Promise<IChargeResponse> => {
  const req_body = {
    ...body,
    transaction_details: {
      ...body.transaction_details,
      order_id: `${body.transaction_details.order_id}:${generateRandomString(
        5
      )}`,
    },
    bank_transfer: body.bank_transfer || undefined,
    // credit_card: body.credit_card || undefined,
  };
  return fetch(`${config.midtrans_url}/v2/charge`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      Authorization: `Basic ${toBase64(`${config.midtrans_server_key}:`)}`,
    },
    body: JSON.stringify(req_body),
  })
    .then(async (res) => {
      return res.json();
    })
    .catch((error: any) => {
      console.error(error);
      throw {
        statusCode: 500,
        statusMessage: error.message,
      };
    });
};

export const getTransactionStatus = async (
  orderId: string
): Promise<TPaymentStatus> => {
  return fetch(`${config.midtrans_url}/v2/${orderId}/status`, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      Authorization: `Basic ${toBase64(`${config.midtrans_server_key}:`)}`,
    },
  })
    .then(async (res) => {
      const response: IChargeResponse = await res.json();
      let status: TPaymentStatus = "pending";
      if (
        response.transaction_status === "settlement" &&
        response.fraud_status === "accept"
      ) {
        status = "success";
      } else if (response.transaction_status === "pending") {
        status = "pending";
      } else if (response.transaction_status === "expire") {
        status = "expired";
      } else if (response.transaction_status === "cancel") {
        status = "canceled";
      }
      return status;
    })
    .catch((error: any) => {
      console.error(error);
      throw {
        statusCode: 500,
        statusMessage: error.message,
      };
    });
};

export const cancelPayment = async (
  orderId: string
): Promise<midtransNotificationBody> => {
  return fetch(`${config.midtrans_url}/v2/${orderId}/cancel`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      Authorization: `Basic ${toBase64(`${config.midtrans_server_key}:`)}`,
    },
  })
    .then(async (res) => {
      return res.json();
    })
    .catch((error) => {
      throw error;
    });
};

const toBase64 = (str: string): string => {
  return Buffer.from(str).toString("base64");
};

interface midtransNotificationBody {
  order_id: string;
  status_code: string;
  transaction_status: string;
  fraud_status: string;
  payment_type: string;
  transaction_time: string;
  transaction_id: string;
  status_message: string;
  gross_amount: string;
  signature_key: string;
}
export const verifySignature = (body: midtransNotificationBody) => {
  const { order_id, status_code, gross_amount, signature_key } = body;
  const { midtrans_server_key } = config;
  const signature = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${midtrans_server_key}`)
    .digest("hex");
  const signatureBuffer = Buffer.from(signature);
  const keyBuffer = Buffer.from(signature_key);

  if (signatureBuffer.length !== keyBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(signatureBuffer, keyBuffer);
};
