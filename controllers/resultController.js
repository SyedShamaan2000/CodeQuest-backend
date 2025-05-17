const Result = require("../models/resultModel");
const Test = require("../models/testModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * Get all results (admin only)
 */
exports.getAllResults = catchAsync(async (req, res, next) => {
    const results = await Result.find();

    res.status(200).json({
        status: "success",
        message: "All Results found",
        results: results.length,
        data: { results },
    });
});

/**
 * Get all results created by the logged-in user
 */
exports.getAllMyResults = catchAsync(async (req, res, next) => {
    const results = await Result.find({ createdBy: req.user.id });

    res.status(200).json({
        status: "success",
        message: "All Results found",
        results: results.length,
        data: { results },
    });
});

/**
 * Get a specific result by test ID (admin and owner check)
 */
exports.getResult = catchAsync(async (req, res, next) => {
    const test = await Test.findById(req.params.id);
    const result = await Result.findOne({ testID: req.params.id });

    if (!result) {
        return next(new AppError("No result found with that ID", 404));
    }

    // Check if current user created the test
    if (test.createdBy.toString() !== req.user.id) {
        return next(
            new AppError("You are not allowed to view this result", 403)
        );
    }

    res.status(200).json({
        status: "success",
        message: "Result found",
        data: { result },
    });
});

/**
 * Get a specific result by test ID for logged-in user only
 */
exports.getMyResult = catchAsync(async (req, res, next) => {
    const result = await Result.findOne({ testID: req.params.id });

    if (!result) {
        return next(new AppError("No result found with that ID", 404));
    }

    // Check if logged-in user created the result
    if (result.createdBy.toHexString() !== req.user.id) {
        return next(
            new AppError("You are not allowed to view this result", 403)
        );
    }

    res.status(200).json({
        status: "success",
        message: "Result found",
        data: { result },
    });
});

/**
 * Create a new result (if not already exists for the test)
 */
exports.createResult = catchAsync(async (req, res, next) => {
    const test = await Test.findById(req.body.testID);

    if (!test) {
        return next(new AppError("No test found with that ID", 404));
    }

    const existingResult = await Result.findOne({ testID: test._id });
    if (existingResult) {
        return next(new AppError("Result of this test already exists", 400));
    }

    const newResult = await Result.create(req.body);

    res.status(201).json({
        status: "success",
        message: "Result created successfully",
        data: { newResult },
    });
});

/**
 * Update a result by ID
 */
exports.updateResult = catchAsync(async (req, res, next) => {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!result) {
        return next(new AppError("No result found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Result updated successfully",
        data: { result },
    });
});

/**
 * Delete a result by ID
 */
exports.deleteResult = catchAsync(async (req, res, next) => {
    const result = await Result.findByIdAndDelete(req.params.id);

    if (!result) {
        return next(new AppError("No result found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Result deleted successfully",
        data: null,
    });
});
