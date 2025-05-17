const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");

// Generate JWT token with user id and secret from env
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Send JWT token in HTTP-only cookie and JSON response
const createSendtoken = (user, statusCode, message, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours expiry
        httpOnly: true, // cookie not accessible by JS
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true; // HTTPS only in prod

    res.cookie("jwt", token, cookieOptions);

    // Remove sensitive data before sending response
    user.password = undefined;
    user.active = undefined;

    res.status(statusCode).json({
        status: "success",
        message,
        token,
        data: { user },
    });
};

// User signup controller
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });

    createSendtoken(newUser, 201, "User signed up successfully", res);
});

// User login controller
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password provided
    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    // Find user and select password field explicitly
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password matches
    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }

    createSendtoken(user, 200, "User logged in successfully", res);
});

// Protect routes middleware - verify JWT token and user
exports.protect = catchAsync(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // If no token, user not logged in
    if (!token) {
        return next(
            new AppError("You are not logged in! Please log in to access", 401)
        );
    }

    // Verify token and decode payload
    const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_KEY
    );

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                "The user belonging to this token does no longer exist",
                401
            )
        );
    }

    // Check if user changed password after token was issued
    if (currentUser.checkChangedPassword(decoded.iat)) {
        return next(
            new AppError(
                "User recently changed password! Please log in again",
                401
            )
        );
    }

    // Attach user to request object for next middlewares
    req.user = currentUser;
    next();
});

// Authorization middleware to restrict access based on user roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    "You do not have permission to perform this action",
                    403
                )
            );
        }
        next();
    };
};

// Forgot password controller - sends reset token to email
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(
            new AppError("There is no user with this email address", 404)
        );
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateModifiedOnly: true });

    // Construct reset URL for email
    const resetURL = `${req.protocol}://${req.get(
        "host"
    )}/users/resetPassword/${resetToken}`;

    const message = `Forgot your Password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        // Send email with reset token
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 mins)",
            message,
        });

        res.status(200).json({
            status: "success",
            message: "token sent to email",
        });
    } catch (err) {
        // Reset token fields if email sending fails
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateModifiedOnly: true });

        return next(
            new AppError(
                "There was an error sending the email. Please try again later!",
                500
            )
        );
    }
});

// Reset password controller using token from URL
exports.resetPassword = catchAsync(async (req, res, next) => {
    // Hash token from URL params to compare with DB
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    // Find user by token and check token expiry
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    // If no user or token expired, error
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
    }

    // Update password and clear reset token fields
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });

    // Log in user by sending JWT
    createSendtoken(user, 200, "Password reset successfully", res);
});

// Update password for logged-in user
exports.updatePassword = catchAsync(async (req, res, next) => {
    // Get user including password
    const user = await User.findById(req.user.id).select("+password");

    // Check current password correctness
    if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("Your current password is wrong", 401));
    }

    // Update password and save
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save({ validateModifiedOnly: true });

    // Log in user with new password
    createSendtoken(user, 200, "Password updated successfully", res);
});
