const AppError = require("../utils/appError");

// Duplicate key error handler (e.g., unique fields like email)
const handleDuplicateFieldsDB = (err) => {
    const value = Object.values(err.keyValue)[0];
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
};

// Cast error handler (invalid MongoDB ID or field type)
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

// Validation error handler (e.g., required fields, min/max length)
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

// JWT token invalid error
const handleJWTError = () =>
    new AppError("Invalid token. Please log in again", 401);

// JWT token expired error
const handleJWTExpiredError = () =>
    new AppError("Token expired. Please log in again", 401);

// Send error in development with full details
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack,
    });
};

// Send error in production (safe output for client)
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error("ERROR 💥", err);
        res.status(500).json({
            status: "error",
            message: "Something went wrong!",
        });
    }
};

// Global error handling middleware
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = { ...err };
        error.message = err.message;

        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === "CastError") error = handleCastErrorDB(error);
        if (error.name === "ValidationError")
            error = handleValidationErrorDB(error);
        if (error.name === "JsonWebTokenError") error = handleJWTError();
        if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};
