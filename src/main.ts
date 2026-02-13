import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { eq } from "drizzle-orm";
import { getEnv, validateEnv } from "@/env";
import { getDb } from "@/db/config";
import { errorMiddleware } from "@/api/middleware/errorHandler";
import { authMiddleware } from "@/api/middleware/auth";

// Validate environment variables on startup
validateEnv();

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Error handling middleware
app.use("*", errorMiddleware);

// Health check endpoint (no auth required)
app.get("/health", (c) => {
  const env = getEnv();
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: "0.1.0",
  });
});

// Auth routes (no auth required)
app.post("/auth/register", async (c) => {
  const { registerSchema } = await import("@/lib/validation");
  const { hashPassword } = await import("@/lib/hashing");
  const { ConflictError, ValidationError } = await import("@/lib/errors");
  const { signToken } = await import("@/lib/jwt");

  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    const db = getDb();
    const { users } = await import("@/db/schema");

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    if (existing.length > 0) {
      throw new ConflictError("User with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);
    const result = await db
      .insert(users)
      .values({
        email: data.email,
        password_hash: passwordHash,
        full_name: data.full_name,
        phone: data.phone,
        role: "seller", // Default to seller for new users
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    const user = result[0];
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "seller" | "customer",
    });

    return c.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token,
      },
      201 as any,
    );
  } catch (error) {
    if (error instanceof (await import("@/lib/errors")).AppError) {
      throw error;
    }
    if (error instanceof (await import("zod")).ZodError) {
      throw new ValidationError("Validation failed", { errors: error.errors });
    }
    throw error;
  }
});

app.post("/auth/login", async (c) => {
  const { loginSchema } = await import("@/lib/validation");
  const { comparePassword } = await import("@/lib/hashing");
  const { AuthError, ErrorCode } = await import("@/lib/errors");
  const { signToken } = await import("@/lib/jwt");

  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const db = getDb();
    const { users } = await import("@/db/schema");

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    const user = result[0];

    if (!user) {
      throw new AuthError(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password",
      );
    }

    const isValidPassword = await comparePassword(
      data.password,
      user.password_hash,
    );
    if (!isValidPassword) {
      throw new AuthError(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password",
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "seller" | "customer",
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof (await import("@/lib/errors")).AppError) {
      throw error;
    }
    if (error instanceof (await import("zod")).ZodError) {
      throw new (await import("@/lib/errors")).ValidationError(
        "Validation failed",
        { errors: error.errors },
      );
    }
    throw error;
  }
});

// Protected routes (require auth)
app.use("/api/*", authMiddleware);

// Store routes
app.post("/api/stores", async (c) => {
  const { createStore } = await import("@/api/handlers/store");
  return createStore(c);
});

app.get("/api/stores", async (c) => {
  const { getUserStores } = await import("@/api/handlers/store");
  return getUserStores(c);
});

app.get("/api/stores/:storeId", async (c) => {
  const { getStore } = await import("@/api/handlers/store");
  return getStore(c);
});

app.get("/api/stores/slug/:slug", async (c) => {
  const { getStoreBySlug } = await import("@/api/handlers/store");
  return getStoreBySlug(c);
});

app.put("/api/stores/:storeId", async (c) => {
  const { updateStore } = await import("@/api/handlers/store");
  return updateStore(c);
});

app.delete("/api/stores/:storeId", async (c) => {
  const { deleteStore } = await import("@/api/handlers/store");
  return deleteStore(c);
});

// Product routes
app.post("/api/stores/:storeId/products", async (c) => {
  const { createProduct } = await import("@/api/handlers/product");
  return createProduct(c);
});

app.get("/api/stores/:storeId/products", async (c) => {
  const { listProducts } = await import("@/api/handlers/product");
  return listProducts(c);
});

app.get("/api/stores/:storeId/products/:productId", async (c) => {
  const { getProduct } = await import("@/api/handlers/product");
  return getProduct(c);
});

app.put("/api/stores/:storeId/products/:productId", async (c) => {
  const { updateProduct } = await import("@/api/handlers/product");
  return updateProduct(c);
});

app.delete("/api/stores/:storeId/products/:productId", async (c) => {
  const { deleteProduct } = await import("@/api/handlers/product");
  return deleteProduct(c);
});

app.get("/api/stores/:storeId/products/search", async (c) => {
  const { searchProducts } = await import("@/api/handlers/product");
  return searchProducts(c);
});

// Customer routes
app.post("/api/stores/:storeId/customers", async (c) => {
  const { createCustomer } = await import("@/api/handlers/customer");
  return createCustomer(c);
});

app.get("/api/stores/:storeId/customers", async (c) => {
  const { listCustomers } = await import("@/api/handlers/customer");
  return listCustomers(c);
});

app.get("/api/stores/:storeId/customers/:customerId", async (c) => {
  const { getCustomer } = await import("@/api/handlers/customer");
  return getCustomer(c);
});

app.put("/api/stores/:storeId/customers/:customerId", async (c) => {
  const { updateCustomer } = await import("@/api/handlers/customer");
  return updateCustomer(c);
});

app.delete("/api/stores/:storeId/customers/:customerId", async (c) => {
  const { deleteCustomer } = await import("@/api/handlers/customer");
  return deleteCustomer(c);
});

// Order routes
app.post("/api/stores/:storeId/orders", async (c) => {
  const { createOrder } = await import("@/api/handlers/order");
  return createOrder(c);
});

app.get("/api/stores/:storeId/orders", async (c) => {
  const { listOrders } = await import("@/api/handlers/order");
  return listOrders(c);
});

app.get("/api/stores/:storeId/orders/:orderId", async (c) => {
  const { getOrder } = await import("@/api/handlers/order");
  return getOrder(c);
});

app.put("/api/stores/:storeId/orders/:orderId/status", async (c) => {
  const { updateOrderStatus } = await import("@/api/handlers/order");
  return updateOrderStatus(c);
});

app.post("/api/stores/:storeId/orders/:orderId/cancel", async (c) => {
  const { cancelOrder } = await import("@/api/handlers/order");
  return cancelOrder(c);
});

// Payment routes
app.post("/api/payments/create", authMiddleware, async (c) => {
  const { createPayment } = await import("@/api/handlers/payment");
  return createPayment(c);
});

app.get("/api/payments/:paymentId", authMiddleware, async (c) => {
  const { getPayment } = await import("@/api/handlers/payment");
  return getPayment(c);
});

app.get("/api/payments/status/:referenceId", authMiddleware, async (c) => {
  const { checkPaymentStatus } = await import("@/api/handlers/payment");
  return checkPaymentStatus(c);
});

// Midtrans webhook (no auth required)
app.post("/api/payments/webhook/midtrans", async (c) => {
  const { midtransWebhook } = await import("@/api/handlers/payment");
  return midtransWebhook(c);
});

// WhatsApp webhook (no auth required, Meta handles signature verification)
app.get("/api/webhooks/whatsapp", async (c) => {
  const { whatsappWebhookVerify } = await import("@/api/handlers/whatsapp");
  return whatsappWebhookVerify(c);
});

app.post("/api/webhooks/whatsapp", async (c) => {
  const { whatsappWebhookReceive } = await import("@/api/handlers/whatsapp");
  return whatsappWebhookReceive(c);
});

// Inventory routes
app.get("/api/stores/:storeId/inventory/products/:variantId", async (c) => {
  const { getInventoryHandler } = await import("@/api/handlers/inventory");
  return getInventoryHandler(c);
});

app.post("/api/stores/:storeId/inventory/reserve", async (c) => {
  const { reserveStockHandler } = await import("@/api/handlers/inventory");
  return reserveStockHandler(c);
});

app.post("/api/stores/:storeId/inventory/adjust", async (c) => {
  const { adjustInventoryHandler } = await import("@/api/handlers/inventory");
  return adjustInventoryHandler(c);
});

app.get("/api/stores/:storeId/inventory/movements", async (c) => {
  const { getMovementsHandler } = await import("@/api/handlers/inventory");
  return getMovementsHandler(c);
});

app.post("/api/stores/:storeId/inventory/release/:reservationId", async (c) => {
  const { releaseReservationHandler } =
    await import("@/api/handlers/inventory");
  return releaseReservationHandler(c);
});

app.get("/api/stores/:storeId/inventory/low-stock", async (c) => {
  const { checkLowStockHandler } = await import("@/api/handlers/inventory");
  return checkLowStockHandler(c);
});

// AI Agent routes
app.post("/api/agent/chat", authMiddleware, async (c) => {
  const { agentChat } = await import("@/api/handlers/agent");
  return agentChat(c);
});

app.get("/api/agent/history/:conversationId", authMiddleware, async (c) => {
  const { getConversationHistory } = await import("@/api/handlers/agent");
  return getConversationHistory(c);
});

app.delete(
  "/api/agent/conversation/:conversationId",
  authMiddleware,
  async (c) => {
    const { clearConversation } = await import("@/api/handlers/agent");
    return clearConversation(c);
  },
);

// Start server
const env = getEnv();
export default {
  port: env.PORT,
  fetch: app.fetch,
};

console.log(
  `🚀 Server starting on port ${env.PORT} in ${env.NODE_ENV} environment`,
);
