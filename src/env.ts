import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000").transform(Number),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRY: z.string().default("24h"),

  // Payment Gateway - Midtrans (All-in-One: QRIS, Bank Transfer, Credit Card, E-Wallet)
  MIDTRANS_SERVER_KEY: z.string().min(1, "MIDTRANS_SERVER_KEY is required"),
  MIDTRANS_CLIENT_KEY: z.string().min(1, "MIDTRANS_CLIENT_KEY is required"),
  MIDTRANS_MERCHANT_ID: z.string().min(1, "MIDTRANS_MERCHANT_ID is required"),
  MIDTRANS_ENV: z.enum(["sandbox", "production"]).default("sandbox"),

  // WhatsApp Business API (optional for MVP)
  WHATSAPP_BUSINESS_PHONE_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

  // Telegram (optional for future)
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  // AI LLM Providers (for Agent)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LLAMA_API_KEY: z.string().optional(),
  LLAMA_BASE_URL: z.string().optional(),

  // Admin
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "Admin password must be at least 8 characters"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function getEnv(): Env {
  if (!env) {
    try {
      env = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Environment validation failed:");
        error.errors.forEach((err) => {
          console.error(`  ${err.path.join(".")}: ${err.message}`);
        });
      }
      throw error;
    }
  }
  return env;
}

export function validateEnv(): Env {
  return getEnv();
}
