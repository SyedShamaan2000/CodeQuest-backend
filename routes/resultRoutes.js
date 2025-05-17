const express = require("express");
const router = express.Router();
const resultController = require("../controllers/resultController");
const authController = require("../controllers/authController");

/**
 * Routes for result resource
 */

// Get all results of the logged-in user
router.get(
    "/myResults",
    authController.protect,
    resultController.getAllMyResults
);

// Get a specific result of the logged-in user by ID
router.get(
    "/myResults/:id",
    authController.protect,
    resultController.getMyResult
);

// Admin-only: Get all results or create a new result
router
    .route("/")
    .get(
        authController.protect,
        authController.restrictTo("admin"),
        resultController.getAllResults
    )
    .post(authController.protect, resultController.createResult);

// Get, update (admin-only), or delete (admin-only) a result by 'id' route
router
    .route("/id")
    .get(authController.protect, resultController.getResult)
    .patch(
        authController.protect,
        authController.restrictTo("admin"),
        resultController.updateResult
    )
    .delete(
        authController.protect,
        authController.restrictTo("admin"),
        resultController.deleteResult
    );

module.exports = router;
