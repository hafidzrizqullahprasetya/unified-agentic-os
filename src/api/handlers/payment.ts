import { Context } from "hono";
import { paymentService } from "../../services/payment.service";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  PaymentError,
  ErrorCode,
} from "../../lib/errors";

// Validation schemas
const createPaymentSchema = z.object({
  orderId: z.number().int().positive("Order ID must be a positive integer"),
  method: z.enum(["qris", "bank_transfer", "credit_card", "e_wallet", "cash"]),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().min(10, "Invalid phone number"),
  customerName: z.string().min(2, "Name is required"),
});

const webhookSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  transaction_status: z.string(),
  signature_key: z.string(),
  gross_amount: z.union([z.number(), z.string()]),
});

/**
 * POST /api/payments/create
 * Create payment transaction
 */
export async function createPayment(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validated = createPaymentSchema.parse(body);

    // Note: In production, you would fetch actual order and store details
    // For now, we'll use placeholder values
    const payment = await paymentService.createPayment({
      orderId: validated.orderId,
      storeId: user.storeId || 1,
      amount: body.amount || 0,
      method: validated.method,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      customerName: validated.customerName,
      orderNumber: `ORD-${validated.orderId}-${Date.now()}`,
    });

    return c.json(
      {
        success: true,
        data: payment,
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    if (error instanceof Error) {
      throw new PaymentError(ErrorCode.PAYMENT_FAILED, error.message);
    }
    throw error;
  }
}

/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
export async function getPayment(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const paymentId = parseInt(c.req.param("paymentId"));
    if (isNaN(paymentId)) {
      throw new ValidationError("Invalid payment ID");
    }

    const payment = await paymentService.getPaymentByOrderId(paymentId);
    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    return c.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw error;
  }
}

/**
 * GET /api/payments/status/:referenceId
 * Check payment status
 */
export async function checkPaymentStatus(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const referenceId = c.req.param("referenceId");
    if (!referenceId) {
      throw new ValidationError("Reference ID is required");
    }

    const status = await paymentService.checkPaymentStatus(referenceId);

    return c.json({
      success: true,
      data: status,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new PaymentError(ErrorCode.PAYMENT_FAILED, error.message);
    }
    throw error;
  }
}

/**
 * POST /api/payments/webhook/midtrans
 * Midtrans webhook handler (no auth required)
 */
export async function midtransWebhook(c: Context) {
  try {
    const body = await c.req.json();
    const validated = webhookSchema.parse(body);

    const result = await paymentService.handleMidtransWebhook(validated);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Midtrans expects 200 OK even if there's an error
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      200,
    );
  }
}
