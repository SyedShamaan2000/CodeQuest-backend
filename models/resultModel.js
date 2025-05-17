const mongoose = require("mongoose");
const { Double } = require("mongodb");
require("mongoose-double")(mongoose); // Extend mongoose to support Double type

// Define schema for test results
const resultSchema = new mongoose.Schema({
    testID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: [true, "Please enter the test ID"],
        unique: true,
    },
    testKey: {
        type: String,
        required: [true, "Please enter test key"],
        unique: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please enter the user ID"],
    },
    candidate: {
        type: [
            {
                name: {
                    type: String,
                    required: [true, "Please enter candidate's name"],
                },
                email: {
                    type: String,
                    required: [true, "Please enter candidate's email"],
                },
                score: {
                    type: Double,
                    default: 0.0,
                },
            },
        ],
        validate: {
            validator: function () {
                // Validation: name or email must not be empty
                return this.name !== "" && this.email !== "";
            },
            message: "Please enter valid candidate details",
        },
        usePushEach: true, // For MongoDB < 3.6 compatibility (optional)
    },
});

const Result = mongoose.model("Result", resultSchema);
module.exports = Result;
