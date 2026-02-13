import { Context, Next } from "hono";
import { ErrorCode } from "@/lib/errors";
export declare function errorMiddleware(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: {
        [x: string]: import("hono/utils/types").JSONValue;
    };
}, any, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        suggestion: string;
    };
}, any, "json">) | undefined>;
//# sourceMappingURL=errorHandler.d.ts.map