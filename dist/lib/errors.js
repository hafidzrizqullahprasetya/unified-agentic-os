export var ErrorCode;
(function (ErrorCode) {
    // Auth errors (1000-1999)
    ErrorCode["UNAUTHORIZED"] = "AUTH_001";
    ErrorCode["INVALID_CREDENTIALS"] = "AUTH_002";
    ErrorCode["TOKEN_EXPIRED"] = "AUTH_003";
    ErrorCode["TOKEN_INVALID"] = "AUTH_004";
    ErrorCode["USER_NOT_FOUND"] = "AUTH_005";
    ErrorCode["USER_ALREADY_EXISTS"] = "AUTH_006";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "AUTH_007";
    // Validation errors (2000-2999)
    ErrorCode["VALIDATION_FAILED"] = "VAL_001";
    ErrorCode["INVALID_INPUT"] = "VAL_002";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "VAL_003";
    ErrorCode["INVALID_EMAIL"] = "VAL_004";
    ErrorCode["INVALID_PHONE"] = "VAL_005";
    ErrorCode["INVALID_PASSWORD"] = "VAL_006";
    ErrorCode["INVALID_ENUM"] = "VAL_007";
    // Resource errors (3000-3999)
    ErrorCode["NOT_FOUND"] = "RES_001";
    ErrorCode["CONFLICT"] = "RES_002";
    ErrorCode["FORBIDDEN"] = "RES_003";
    ErrorCode["DUPLICATE_RESOURCE"] = "RES_004";
    // Payment errors (4000-4999)
    ErrorCode["PAYMENT_FAILED"] = "PAY_001";
    ErrorCode["PAYMENT_DECLINED"] = "PAY_002";
    ErrorCode["INVALID_PAYMENT_METHOD"] = "PAY_003";
    ErrorCode["INSUFFICIENT_FUNDS"] = "PAY_004";
    ErrorCode["PAYMENT_TIMEOUT"] = "PAY_005";
    ErrorCode["PAYMENT_PROCESSING"] = "PAY_006";
    // Inventory errors (5000-5999)
    ErrorCode["OUT_OF_STOCK"] = "INV_001";
    ErrorCode["INSUFFICIENT_STOCK"] = "INV_002";
    ErrorCode["RESERVATION_FAILED"] = "INV_003";
    ErrorCode["INVALID_QUANTITY"] = "INV_004";
    // Rate limiting errors (6000-6999)
    ErrorCode["RATE_LIMITED"] = "RATE_001";
    // Webhook errors (7000-7999)
    ErrorCode["WEBHOOK_FAILED"] = "HOOK_001";
    ErrorCode["WEBHOOK_TIMEOUT"] = "HOOK_002";
    ErrorCode["WEBHOOK_RETRY_EXHAUSTED"] = "HOOK_003";
    // Server errors (9000-9999)
    ErrorCode["INTERNAL_ERROR"] = "SRV_001";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SRV_002";
    ErrorCode["DATABASE_ERROR"] = "SRV_003";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "SRV_004";
})(ErrorCode || (ErrorCode = {}));
export const ErrorMessages = {
    // Auth
    [ErrorCode.UNAUTHORIZED]: "Authentication required",
    [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
    [ErrorCode.TOKEN_EXPIRED]: "Token has expired",
    [ErrorCode.TOKEN_INVALID]: "Invalid token",
    [ErrorCode.USER_NOT_FOUND]: "User not found",
    [ErrorCode.USER_ALREADY_EXISTS]: "User with this email already exists",
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: "Insufficient permissions for this action",
    // Validation
    [ErrorCode.VALIDATION_FAILED]: "Validation failed",
    [ErrorCode.INVALID_INPUT]: "Invalid input provided",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "Missing required field",
    [ErrorCode.INVALID_EMAIL]: "Invalid email format",
    [ErrorCode.INVALID_PHONE]: "Invalid phone number format",
    [ErrorCode.INVALID_PASSWORD]: "Password does not meet security requirements",
    [ErrorCode.INVALID_ENUM]: "Invalid value for enumerated field",
    // Resources
    [ErrorCode.NOT_FOUND]: "Resource not found",
    [ErrorCode.CONFLICT]: "Resource conflict",
    [ErrorCode.FORBIDDEN]: "Access forbidden",
    [ErrorCode.DUPLICATE_RESOURCE]: "Resource with this identifier already exists",
    // Payments
    [ErrorCode.PAYMENT_FAILED]: "Payment processing failed",
    [ErrorCode.PAYMENT_DECLINED]: "Payment was declined",
    [ErrorCode.INVALID_PAYMENT_METHOD]: "Invalid payment method",
    [ErrorCode.INSUFFICIENT_FUNDS]: "Insufficient funds",
    [ErrorCode.PAYMENT_TIMEOUT]: "Payment request timed out",
    [ErrorCode.PAYMENT_PROCESSING]: "Payment is currently being processed",
    // Inventory
    [ErrorCode.OUT_OF_STOCK]: "Product is out of stock",
    [ErrorCode.INSUFFICIENT_STOCK]: "Insufficient stock available",
    [ErrorCode.RESERVATION_FAILED]: "Failed to reserve inventory",
    [ErrorCode.INVALID_QUANTITY]: "Invalid quantity specified",
    // Rate limiting
    [ErrorCode.RATE_LIMITED]: "Too many requests, please try again later",
    // Webhooks
    [ErrorCode.WEBHOOK_FAILED]: "Webhook delivery failed",
    [ErrorCode.WEBHOOK_TIMEOUT]: "Webhook request timed out",
    [ErrorCode.WEBHOOK_RETRY_EXHAUSTED]: "Webhook delivery failed after maximum retries",
    // Server
    [ErrorCode.INTERNAL_ERROR]: "Internal server error",
    [ErrorCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
    [ErrorCode.DATABASE_ERROR]: "Database operation failed",
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: "External service returned an error",
};
export class AppError extends Error {
    code;
    statusCode;
    context;
    suggestion;
    constructor(code, statusCode = 500, message, context, suggestion) {
        super(message || ErrorMessages[code]);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.suggestion = suggestion;
        this.name = "AppError";
        Object.setPrototypeOf(this, AppError.prototype);
    }
    toJSON() {
        const result = {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
        };
        if (this.context) {
            result.context = this.context;
        }
        if (this.suggestion) {
            result.suggestion = this.suggestion;
        }
        return result;
    }
}
export class ValidationError extends AppError {
    constructor(message, context) {
        super(ErrorCode.VALIDATION_FAILED, 400, message, context);
        this.name = "ValidationError";
    }
}
export class NotFoundError extends AppError {
    constructor(resourceType, id) {
        const message = id
            ? `${resourceType} with id ${id} not found`
            : `${resourceType} not found`;
        super(ErrorCode.NOT_FOUND, 404, message);
        this.name = "NotFoundError";
    }
}
export class AuthError extends AppError {
    constructor(code, message) {
        super(code, 401, message);
        this.name = "AuthError";
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "Access forbidden") {
        super(ErrorCode.FORBIDDEN, 403, message);
        this.name = "ForbiddenError";
    }
}
export class ConflictError extends AppError {
    constructor(message, context) {
        super(ErrorCode.CONFLICT, 409, message, context);
        this.name = "ConflictError";
    }
}
export class PaymentError extends AppError {
    constructor(code, message, context) {
        super(code, 402, message, context);
        this.name = "PaymentError";
    }
}
export class InventoryError extends AppError {
    constructor(code, message, context) {
        super(code, 400, message, context);
        this.name = "InventoryError";
    }
}
//# sourceMappingURL=errors.js.map