import { describe, it, expect, vi } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  AuthError,
  ForbiddenError,
  ConflictError,
  PaymentError,
  InventoryError,
  ErrorCode,
  ErrorMessages,
} from "@/lib/errors";

describe("Error Handling Enhancements", () => {
  describe("AppError Base Class", () => {
    it("should create error with code and message", () => {
      const error = new AppError(
        ErrorCode.NOT_FOUND,
        404,
        "Resource not found",
      );

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
    });

    it("should use default message from ErrorMessages", () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 404);

      expect(error.message).toBe(ErrorMessages[ErrorCode.NOT_FOUND]);
    });

    it("should include context in error", () => {
      const context = { resourceId: 123, type: "user" };
      const error = new AppError(
        ErrorCode.NOT_FOUND,
        404,
        "User not found",
        context,
      );

      expect(error.context).toEqual(context);
    });

    it("should include suggestion in error", () => {
      const error = new AppError(
        ErrorCode.INVALID_INPUT,
        400,
        "Invalid email format",
        undefined,
        "Please provide a valid email address",
      );

      expect(error.suggestion).toBe("Please provide a valid email address");
    });

    it("should convert to JSON with all properties", () => {
      const error = new AppError(
        ErrorCode.NOT_FOUND,
        404,
        "Resource not found",
        { id: 123 },
        "Try checking the ID",
      );

      const json = error.toJSON();

      expect(json.code).toBe(ErrorCode.NOT_FOUND);
      expect(json.message).toBe("Resource not found");
      expect(json.statusCode).toBe(404);
      expect(json.context).toEqual({ id: 123 });
      expect(json.suggestion).toBe("Try checking the ID");
    });

    it("should not include context in JSON if undefined", () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 404);
      const json = error.toJSON();

      expect(json.context).toBeUndefined();
    });

    it("should not include suggestion in JSON if undefined", () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 404);
      const json = error.toJSON();

      expect(json.suggestion).toBeUndefined();
    });

    it("should be instanceof Error", () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 500);

      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe("AppError");
    });
  });

  describe("ValidationError", () => {
    it("should create with 400 status code", () => {
      const error = new ValidationError("Field is required");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it("should include context with validation errors", () => {
      const context = { field: "email", reason: "invalid format" };
      const error = new ValidationError("Invalid email", context);

      expect(error.context).toEqual(context);
    });

    it("should have correct name", () => {
      const error = new ValidationError("Test");

      expect(error.name).toBe("ValidationError");
    });
  });

  describe("NotFoundError", () => {
    it("should create with 404 status code", () => {
      const error = new NotFoundError("User");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("should include resource type in message", () => {
      const error = new NotFoundError("Product");

      expect(error.message).toContain("Product");
      expect(error.message).toContain("not found");
    });

    it("should include ID in message if provided", () => {
      const error = new NotFoundError("User", 123);

      expect(error.message).toContain("User");
      expect(error.message).toContain("123");
      expect(error.message).toContain("not found");
    });

    it("should have correct name", () => {
      const error = new NotFoundError("Order");

      expect(error.name).toBe("NotFoundError");
    });
  });

  describe("AuthError", () => {
    it("should create with 401 status code", () => {
      const error = new AuthError(ErrorCode.UNAUTHORIZED);

      expect(error.statusCode).toBe(401);
    });

    it("should use custom message if provided", () => {
      const error = new AuthError(
        ErrorCode.TOKEN_EXPIRED,
        "Your session has expired",
      );

      expect(error.message).toBe("Your session has expired");
    });

    it("should use default message if not provided", () => {
      const error = new AuthError(ErrorCode.UNAUTHORIZED);

      expect(error.message).toBe(ErrorMessages[ErrorCode.UNAUTHORIZED]);
    });

    it("should have correct name", () => {
      const error = new AuthError(ErrorCode.UNAUTHORIZED);

      expect(error.name).toBe("AuthError");
    });
  });

  describe("ForbiddenError", () => {
    it("should create with 403 status code", () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("should use provided message", () => {
      const error = new ForbiddenError("You do not have admin access");

      expect(error.message).toBe("You do not have admin access");
    });

    it("should use default message", () => {
      const error = new ForbiddenError();

      expect(error.message).toBe("Access forbidden");
    });

    it("should have correct name", () => {
      const error = new ForbiddenError();

      expect(error.name).toBe("ForbiddenError");
    });
  });

  describe("ConflictError", () => {
    it("should create with 409 status code", () => {
      const error = new ConflictError("Email already exists");

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCode.CONFLICT);
    });

    it("should include context", () => {
      const context = { field: "email", value: "test@example.com" };
      const error = new ConflictError("Email already in use", context);

      expect(error.context).toEqual(context);
    });

    it("should have correct name", () => {
      const error = new ConflictError("Duplicate entry");

      expect(error.name).toBe("ConflictError");
    });
  });

  describe("PaymentError", () => {
    it("should create with 402 status code", () => {
      const error = new PaymentError(ErrorCode.PAYMENT_FAILED);

      expect(error.statusCode).toBe(402);
    });

    it("should include context with payment details", () => {
      const context = { transactionId: "txn_123", amount: 50000 };
      const error = new PaymentError(
        ErrorCode.PAYMENT_DECLINED,
        "Card declined",
        context,
      );

      expect(error.context).toEqual(context);
    });

    it("should use custom message if provided", () => {
      const error = new PaymentError(
        ErrorCode.PAYMENT_FAILED,
        "Payment gateway timeout",
      );

      expect(error.message).toBe("Payment gateway timeout");
    });

    it("should have correct name", () => {
      const error = new PaymentError(ErrorCode.PAYMENT_FAILED);

      expect(error.name).toBe("PaymentError");
    });
  });

  describe("InventoryError", () => {
    it("should create with 400 status code", () => {
      const error = new InventoryError(ErrorCode.OUT_OF_STOCK);

      expect(error.statusCode).toBe(400);
    });

    it("should include context with inventory details", () => {
      const context = { available: 0, requested: 5, productId: "prod_123" };
      const error = new InventoryError(
        ErrorCode.INSUFFICIENT_STOCK,
        "Not enough stock",
        context,
      );

      expect(error.context).toEqual(context);
    });

    it("should use custom message if provided", () => {
      const error = new InventoryError(
        ErrorCode.OUT_OF_STOCK,
        "This product is temporarily out of stock",
      );

      expect(error.message).toBe("This product is temporarily out of stock");
    });

    it("should have correct name", () => {
      const error = new InventoryError(ErrorCode.OUT_OF_STOCK);

      expect(error.name).toBe("InventoryError");
    });
  });

  describe("Error Codes Coverage", () => {
    it("should have messages for all error codes", () => {
      const errorCodes = Object.values(ErrorCode);

      for (const code of errorCodes) {
        expect(ErrorMessages[code]).toBeDefined();
        expect(ErrorMessages[code].length).toBeGreaterThan(0);
      }
    });

    it("should have proper error code categories", () => {
      expect(ErrorCode.UNAUTHORIZED).toContain("AUTH");
      expect(ErrorCode.VALIDATION_FAILED).toContain("VAL");
      expect(ErrorCode.NOT_FOUND).toContain("RES");
      expect(ErrorCode.PAYMENT_FAILED).toContain("PAY");
      expect(ErrorCode.OUT_OF_STOCK).toContain("INV");
      expect(ErrorCode.RATE_LIMITED).toContain("RATE");
      expect(ErrorCode.WEBHOOK_FAILED).toContain("HOOK");
      expect(ErrorCode.INTERNAL_ERROR).toContain("SRV");
    });
  });

  describe("Error Context and Suggestions", () => {
    it("should support detailed context for debugging", () => {
      const context = {
        userId: 123,
        requestId: "req_abc123",
        timestamp: new Date().toISOString(),
        metadata: {
          action: "create",
          resource: "order",
        },
      };

      const error = new AppError(
        ErrorCode.FORBIDDEN,
        403,
        "User does not have permission to create orders",
        context,
      );

      expect(error.context).toEqual(context);
    });

    it("should provide recovery suggestions", () => {
      const error = new ValidationError("Invalid email format", {
        field: "email",
      });
      error.suggestion =
        "Please enter a valid email address (e.g., user@example.com)";

      expect(error.suggestion).toContain("email");
      expect(error.suggestion).toContain("user@example.com");
    });

    it("should support chaining context information", () => {
      const err1 = new AppError(ErrorCode.DATABASE_ERROR, 500, "Query failed");
      const err2 = new AppError(
        ErrorCode.INTERNAL_ERROR,
        500,
        "Failed to fetch user",
        { originalError: err1.code },
      );

      expect(err2.context?.originalError).toBe(err1.code);
    });
  });

  describe("Error Serialization", () => {
    it("should serialize error with all details", () => {
      const error = new AppError(
        ErrorCode.NOT_FOUND,
        404,
        "User not found",
        { userId: 123 },
        "Try checking the user ID",
      );

      const json = error.toJSON();
      const serialized = JSON.stringify(json);

      expect(serialized).toContain("RES_001"); // NOT_FOUND is RES_001
      expect(serialized).toContain("User not found");
      expect(serialized).toContain("404");
      expect(serialized).toContain("userId");
      expect(serialized).toContain("Try checking");
    });

    it("should maintain error information through JSON round-trip", () => {
      const original = new AppError(
        ErrorCode.VALIDATION_FAILED,
        400,
        "Email is required",
        { field: "email" },
        "Please provide your email address",
      );

      const json = original.toJSON();
      const reconstructed = {
        code: json.code,
        message: json.message,
        statusCode: json.statusCode,
        context: json.context,
        suggestion: json.suggestion,
      };

      expect(reconstructed.code).toBe(original.code);
      expect(reconstructed.message).toBe(original.message);
      expect(reconstructed.statusCode).toBe(original.statusCode);
      expect(reconstructed.context).toEqual(original.context);
      expect(reconstructed.suggestion).toBe(original.suggestion);
    });
  });

  describe("HTTP Status Codes", () => {
    it("should use appropriate status codes for error types", () => {
      const errors = [
        { error: new AuthError(ErrorCode.UNAUTHORIZED), expected: 401 },
        { error: new PaymentError(ErrorCode.PAYMENT_FAILED), expected: 402 },
        { error: new ForbiddenError(), expected: 403 },
        { error: new NotFoundError("Item"), expected: 404 },
        { error: new ConflictError("Duplicate"), expected: 409 },
        { error: new AppError(ErrorCode.RATE_LIMITED, 429), expected: 429 },
        { error: new AppError(ErrorCode.INTERNAL_ERROR, 500), expected: 500 },
        {
          error: new AppError(ErrorCode.SERVICE_UNAVAILABLE, 503),
          expected: 503,
        },
      ];

      for (const { error, expected } of errors) {
        expect(error.statusCode).toBe(expected);
      }
    });
  });

  describe("Error Message Consistency", () => {
    it("should use consistent error message format", () => {
      const errors = [
        new ValidationError("Test validation"),
        new NotFoundError("Resource"),
        new AuthError(ErrorCode.UNAUTHORIZED),
        new ForbiddenError("Access denied"),
        new ConflictError("Duplicate found"),
      ];

      for (const error of errors) {
        expect(error.message).toBeTruthy();
        expect(typeof error.message).toBe("string");
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
  });
});
