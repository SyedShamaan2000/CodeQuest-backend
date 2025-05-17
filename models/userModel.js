const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please enter your first name"],
    },
    lastName: {
        type: String,
        // lastName is optional
    },
    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minlength: [6, "Minimum password length is 6 characters"],
        select: false, // exclude from query results by default
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            // Only works on save/create, not on update
            validator: function (val) {
                return val === this.password;
            },
            message: "Passwords do not match",
        },
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    passwordChangedAt: Date, // timestamp when password last changed
    passwordResetToken: String, // hashed token for password reset
    passwordResetExpires: Date, // expiry time for reset token
    active: {
        type: Boolean,
        default: true,
        select: false, // exclude from query results
    },
});

// Hash password before saving if modified
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; // Remove passwordConfirm field
    next();
});

// Update passwordChangedAt if password is modified (and not new document)
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 sec for token issuance delay
    next();
});

// Only find active users on queries starting with "find"
userSchema.pre(/^find/, function (next) {
    this.find({ active: true });
    next();
});

// Compare candidate password with hashed user password
userSchema.methods.checkPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if user changed password after JWT was issued
userSchema.methods.checkChangedPassword = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimeStamp < changedTimeStamp;
    }
    return false;
};

// Generate password reset token, hash it and set expiry
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
