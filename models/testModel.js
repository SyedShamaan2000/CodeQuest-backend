const mongoose = require("mongoose");
const { required } = require("nodemon/lib/config");
const validator = require("validator");

// Define schema for Test
const testSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a Test name"],
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  company: {
    type: String,
    required: [true, "Please enter your organisation name"],
  },
  key: {
    type: String,
    unique: true, // Unique key to identify the test
  },
  Question: {
    type: [
      {
        name: {
          type: String,
          required: [true, "Please enter question name"],
        },
        statement: {
          type: String,
          required: [true, "Please enter question description"],
        },
        constraints: {
          type: String,
          required: [true, "Please enter constraints for the question"],
        },
        predefinedStructure: {
          type: String,
          required: [true, "Please enter code structure for execution"],
        },
        testcases: {
          type: [
            {
              input: {
                type: [String],
                required: [true, "Please enter input for the test case"],
              },
              output: {
                type: [String],
                required: [true, "Please enter output for the test case"],
              },
              testCaseCommand: {
                type: String,
                required: [true, "Please enter the test command"],
              },
            },
          ],
          validate: {
            validator: function () {
              return this.testcases.length > 0;
            },
            message: "Please enter a test case",
          },
        },
      },
    ],
    validate: {
      validator: function () {
        return this.Question.length > 0;
      },
      message: "Please enter a question set",
    },
  },
  startTime: {
    type: Date,
    required: [true, "Please enter test start time"],
  },
  endTime: {
    type: Date,
    required: [true, "Please enter test end time"],
  },
  duration: {
    type: Number,
    required: [true, "Please enter test duration"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Please enter user id"],
  },
  active: {
    type: Boolean,
    default: true,
    select: false, // Exclude from query results by default
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// Middleware to exclude inactive tests in queries
testSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

const Test = mongoose.model("Test", testSchema);
module.exports = Test;
