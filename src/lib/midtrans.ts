import midtransClient from "midtrans-client";
import { getEnv } from "../env";

// Lazy initialize clients
let snapClient: InstanceType<typeof midtransClient.Snap> | null = null;
let coreClient: InstanceType<typeof midtransClient.CoreApi> | null = null;

function getSnapClient() {
  if (!snapClient) {
    const env = getEnv();
    snapClient = new midtransClient.Snap({
      isProduction: env.MIDTRANS_ENV === "production",
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    });
  }
  return snapClient;
}

function getCoreClient() {
  if (!coreClient) {
    const env = getEnv();
    coreClient = new midtransClient.CoreApi({
      isProduction: env.MIDTRANS_ENV === "production",
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    });
  }
  return coreClient;
}

export interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface MidtransCustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
}

export interface MidtransPaymentItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface CreatePaymentParams {
  transaction: MidtransTransactionDetails;
  customer: MidtransCustomerDetails;
  items: MidtransPaymentItem[];
  payment_type?: "credit_card" | "bank_transfer" | "qris" | "e_wallet";
}

/**
 * Create payment transaction and get Snap token for frontend
 */
export async function createPaymentTransaction(
  params: CreatePaymentParams,
): Promise<{
  token: string;
  redirect_url: string;
}> {
  const snap = getSnapClient();
  const transactionPayload = {
    transaction_details: params.transaction,
    customer_details: params.customer,
    item_details: params.items,
    // Enable all payment methods
    enabled_payments: [
      "credit_card",
      "bank_transfer",
      "qris",
      "gcg_akulaku",
      "akulaku",
      "bca_va",
      "bni_va",
      "mandiri_va",
      "permata_va",
      "other_va",
    ],
  };

  try {
    const transaction = await snap.createTransaction(transactionPayload);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  } catch (error) {
    console.error("Midtrans error:", error);
    throw new Error(
      `Failed to create payment: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Charge payment directly (for other payment methods)
 */
export async function chargePayment(
  orderId: string,
  amount: number,
  paymentMethod: "bank_transfer" | "qris" | "credit_card",
  customerEmail: string,
) {
  const core = getCoreClient();
  const chargePayload = {
    payment_type: paymentMethod,
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      email: customerEmail,
    },
  };

  try {
    const charge = await core.charge(chargePayload);
    return charge;
  } catch (error) {
    console.error("Midtrans charge error:", error);
    throw new Error(
      `Failed to charge payment: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(orderId: string) {
  const core = getCoreClient();
  try {
    const status = await core.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error("Midtrans status error:", error);
    throw new Error(
      `Failed to get payment status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Verify webhook signature from Midtrans
 */
export function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: number | string,
  serverKey: string,
  signatureKey: string,
): boolean {
  const data = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const crypto = require("crypto");
  const hash = crypto.createHash("sha512").update(data).digest("hex");
  return hash === signatureKey;
}

/**
 * Handle webhook and update payment status
 */
export async function handleWebhook(webhookBody: any) {
  const {
    order_id,
    status_code,
    transaction_status,
    signature_key,
    gross_amount,
  } = webhookBody;

  const env = getEnv();

  // Verify signature
  const isValid = verifyWebhookSignature(
    order_id,
    status_code,
    gross_amount,
    env.MIDTRANS_SERVER_KEY,
    signature_key,
  );

  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  // Map Midtrans status to our status
  let paymentStatus = "pending";
  if (transaction_status === "settlement" || status_code === "200") {
    paymentStatus = "paid";
  } else if (transaction_status === "pending") {
    paymentStatus = "processing";
  } else if (
    transaction_status === "deny" ||
    transaction_status === "expire" ||
    status_code === "406"
  ) {
    paymentStatus = "failed";
  } else if (transaction_status === "cancel") {
    paymentStatus = "cancelled";
  }

  return {
    orderId: order_id,
    status: paymentStatus,
    transactionStatus: transaction_status,
    statusCode: status_code,
  };
}
