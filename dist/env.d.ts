import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRY: z.ZodDefault<z.ZodString>;
    MIDTRANS_SERVER_KEY: z.ZodString;
    MIDTRANS_CLIENT_KEY: z.ZodString;
    MIDTRANS_MERCHANT_ID: z.ZodString;
    MIDTRANS_ENV: z.ZodDefault<z.ZodEnum<["sandbox", "production"]>>;
    WHATSAPP_API_TOKEN: z.ZodOptional<z.ZodString>;
    TELEGRAM_BOT_TOKEN: z.ZodOptional<z.ZodString>;
    ADMIN_EMAIL: z.ZodString;
    ADMIN_PASSWORD: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRY: string;
    MIDTRANS_SERVER_KEY: string;
    MIDTRANS_CLIENT_KEY: string;
    MIDTRANS_MERCHANT_ID: string;
    MIDTRANS_ENV: "production" | "sandbox";
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
    WHATSAPP_API_TOKEN?: string | undefined;
    TELEGRAM_BOT_TOKEN?: string | undefined;
}, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    MIDTRANS_SERVER_KEY: string;
    MIDTRANS_CLIENT_KEY: string;
    MIDTRANS_MERCHANT_ID: string;
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    JWT_EXPIRY?: string | undefined;
    MIDTRANS_ENV?: "production" | "sandbox" | undefined;
    WHATSAPP_API_TOKEN?: string | undefined;
    TELEGRAM_BOT_TOKEN?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function getEnv(): Env;
export declare function validateEnv(): Env;
export {};
//# sourceMappingURL=env.d.ts.map