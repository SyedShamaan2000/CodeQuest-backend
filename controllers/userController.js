const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Helper function to filter allowed fields from an object
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: "success",
        message: "All users found",
        results: users.length,
        data: { users },
    });
});

// Get single user by ID (admin only)
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError("No user found with that ID", 404));
    res.status(200).json({
        status: "success",
        message: "User found",
        data: { user },
    });
});

// Create new user (admin only)
exports.createUser = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);
    res.status(201).json({
        status: "success",
        message: "User created successfully",
        data: { user: newUser },
    });
});

// Update logged-in user data except password
exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                "This route is not for password updates. Please use /updateMyPassword",
                400
            )
        );
    }

    // Filter only allowed fields to update
    const filteredBody = filterObj(req.body, "firstName", "lastName", "email");

    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: "success",
        message: "User data updated successfully",
        data: { user: updatedUser },
    });
});

// Update user by ID (admin only)
exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!user) return next(new AppError("No User found with that ID", 404));

    res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: { user },
    });
});

// Soft delete logged-in user (set active to false)
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        message: "User deleted successfully",
        data: null,
    });
});

// Hard delete user by ID (admin only)
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return next(new AppError("No user found with that ID", 404));

    res.status(200).json({
        status: "success",
        message: "User deleted successfully",
        data: null,
    });
});
