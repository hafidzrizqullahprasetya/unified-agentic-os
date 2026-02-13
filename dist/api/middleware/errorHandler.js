import { AppError, ErrorCode, ErrorMessages } from "@/lib/errors";
export async function errorMiddleware(c, next) {
    try {
        await next();
    }
    catch (error) {
        console.error("Error caught:", error);
        if (error instanceof AppError) {
            const errorInfo = {
                code: error.code,
                message: error.message,
            };
            if (error.context) {
                errorInfo.context = error.context;
            }
            if (error.suggestion) {
                errorInfo.suggestion = error.suggestion;
            }
            return c.json({
                success: false,
                error: errorInfo,
            }, error.statusCode);
        }
        if (error instanceof SyntaxError) {
            return c.json({
                success: false,
                error: {
                    code: ErrorCode.INVALID_INPUT,
                    message: "Invalid JSON in request body",
                    suggestion: "Please ensure the request body is valid JSON",
                },
            }, 400);
        }
        // Generic error handler
        console.error("Unhandled error:", error);
        return c.json({
            success: false,
            error: {
                code: ErrorCode.INTERNAL_ERROR,
                message: ErrorMessages[ErrorCode.INTERNAL_ERROR],
                suggestion: "Please try again later or contact support if the problem persists",
            },
        }, 500);
    }
}
//# sourceMappingURL=errorHandler.js.map