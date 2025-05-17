const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
// router.get('/logout', logout); // Uncomment if logout implemented

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protected routes for logged-in users
router.patch(
    "/updateMyPassword",
    authController.protect,
    authController.updatePassword
);
router.patch("/updateMe", authController.protect, userController.updateMe);
router.delete("/deleteMe", authController.protect, userController.deleteMe);

// Admin-only routes for managing users
router
    .route("/")
    .get(
        authController.protect,
        authController.restrictTo("admin"),
        userController.getAllUsers
    )
    .post(
        authController.protect,
        authController.restrictTo("admin"),
        userController.createUser
    );

router
    .route("/:id")
    .get(
        authController.protect,
        authController.restrictTo("admin"),
        userController.getUser
    )
    .patch(
        authController.protect,
        authController.restrictTo("admin"),
        userController.updateUser
    )
    .delete(
        authController.protect,
        authController.restrictTo("admin"),
        userController.deleteUser
    );

module.exports = router;
