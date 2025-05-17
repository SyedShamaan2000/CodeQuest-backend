// Custom error class extending the built-in Error
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent Error constructor with the message

        this.statusCode = statusCode; // HTTP status code (e.g., 404, 500)
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; // Set error type
        this.isOperational = true; // Flag to identify operational (expected) errors

        // Captures the current stack trace, excluding constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
