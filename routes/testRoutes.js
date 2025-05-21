const express = require("express");
const router = express.Router();

const testController = require("../controllers/testController");
const authController = require("../controllers/authController");

// ==================== USER-SPECIFIC TEST ROUTES ====================

// Update a test created by the logged-in user
router.patch(
    "/updateMyTest/:testID",
    authController.protect,
    testController.updateMyTest
);

// Delete a test created by the logged-in user
router.delete(
    "/deleteMyTest/:testID",
    authController.protect,
    testController.deleteMyTest
);

// ==================== GENERAL TEST ROUTES ====================

// Get all tests or create a new test (authenticated users only)
router
    .route("/")
    .get(authController.protect, testController.getAllTests)
    .post(authController.protect, testController.createTest);

// Get, update, or delete a specific test (admin only for update/delete)
router
    .route("/:id")
    .get(testController.getTest) // No auth, public access
    .patch(
        authController.protect,
        authController.restrictTo("admin"),
        testController.updateTest
    )
    .delete(
        authController.protect,
        authController.restrictTo("admin"),
        testController.deleteTest
    );

// ==================== TEST EXECUTION ROUTES ====================

// Start a test (fetch questions and info)
router.get("/startTest/:id", testController.startTest);

// Submit a completed test
router.patch("/submit/:id", testController.submitTest);

// Execute Python, Javascript Code
router.route("/execute").post(testController.executeCode);

// Run TestCases
router.route("/run-testcases").post(testController.runTestCase);

module.exports = router;
