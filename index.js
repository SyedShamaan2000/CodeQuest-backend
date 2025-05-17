// Import dependencies
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");

// Routers and Controllers
const testRouter = require("./routes/testRoutes");
const resultRouter = require("./routes/resultRoutes");
const userRouter = require("./routes/userRoutes");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const Test = require("./models/testModel");
const Result = require("./models/resultModel");
const catchAsync = require("./utils/catchAsync");

const app = express();

// ==================== MIDDLEWARES ====================

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests from this IP. Please try again in an hour!",
});
app.use("/api", limiter);

// Body parser
app.use(express.json());

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Sanitize data against XSS attacks
app.use(xss());

// Parse cookies
app.use(cookieParser());

// ==================== UTILS ====================

// Replace escape characters in user-submitted code
function removeSpecialEscapeSequences(str) {
    return str.replaceAll("&lt;", "<");
}

// Evaluate submitted JavaScript code against test cases
const evaluateCode = async (req, res) => {
    try {
        const test = await Test.findById(req.body.testId);

        const func = eval(removeSpecialEscapeSequences(req.body.code));

        const question = test.Question.find(
            (ele) => ele._id.toHexString() === req.body.questionId
        );

        const testCases = question.testcases.map((tc) =>
            tc.input.map((a) => (isNaN(parseFloat(a)) ? a : parseFloat(a)))
        );

        const expectedOutputs = question.testcases.map((tc) => tc.output);

        const results = expectedOutputs.map((expected, i) => {
            return func(testCases[i]) == expected;
        });

        if (!res) return results;

        res.status(200).json({
            message: "Evaluation Done!",
            data: results,
        });
    } catch (err) {
        const errorMessage =
            "Syntax Error: Please check your code syntax and try again.";
        if (res) {
            res.status(500).json({ message: errorMessage });
        }
    }
};

// ==================== ROUTES ====================

// Evaluate single JS code submission
app.post("/js", async (req, res) => {
    await evaluateCode(req, res);
});

// Submit entire test
app.post(
    "/submit/test",
    catchAsync(async (req, res) => {
        const { testID, user, code } = req.body;

        // Prevent resubmission
        const existing = await Result.findOne({
            testID,
            "candidate.email": user.email,
        });

        if (existing) {
            return res.status(400).json({
                status: "fail",
                message: "You have already submitted the test",
            });
        }

        // Evaluate each question
        const evaluations = await Promise.all(
            code.map(async (c) =>
                evaluateCode({
                    body: {
                        testId: testID,
                        questionId: c.questionID,
                        code: c.code,
                    },
                })
            )
        );

        // Calculate score
        const correctCount = evaluations.filter(
            (res) => !res.includes(false)
        ).length;
        const score = (correctCount / evaluations.length) * 100;

        user.score = score;

        // Save result
        const newResult = await Result.updateOne(
            { testID },
            { $push: { candidate: user } }
        );

        res.status(200).json({
            status: "success",
            message: "Your Test Submitted Successfully",
            data: { newResult },
        });
    })
);

// Mount Routers
app.use("/tests", testRouter);
app.use("/results", resultRouter);
app.use("/users", userRouter);

// Base route
app.get("/", (req, res) => {
    res.status(200).send("Hello Server is Up and fine!");
});

// Handle unknown routes
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
