const short = require("short-uuid");
const Result = require("../models/resultModel");
const Test = require("../models/testModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");

// Utility: Filter only allowed fields from object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = el === "score" ? parseFloat(obj[el]) : obj[el];
    }
  });
  return newObj;
};

// ==================== GET ALL TESTS ====================
exports.getAllTests = catchAsync(async (req, res, next) => {
  const tests = await Test.find();

  res.status(200).json({
    status: "success",
    message: "All tests found",
    results: tests.length,
    data: { tests },
  });
});

// ==================== GET A SINGLE TEST ====================
exports.getTest = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.id);
  if (!test) return next(new AppError("No test found with that ID", 404));

  res.status(200).json({
    status: "success",
    message: "Test found",
    data: { test },
  });
});

// ==================== START A TEST ====================
exports.startTest = catchAsync(async (req, res, next) => {
  // console.log("inside start test");

  const test = await Test.findById(req.params.id);
  const startTime = parseInt(test.startTime.getTime() / 1000, 10);
  const endTime = parseInt(test.endTime.getTime() / 1000, 10);
  const currentTime = parseInt(Date.now() / 1000, 10);

  if (currentTime < startTime || currentTime >= endTime) {
    const message = "Test Link Deactivated";
    return res.status(400).json({ status: "fail", message });
  }

  res.status(200).json({
    status: "success",
    message: "Test started successfully",
    data: { test },
  });
});

// ==================== SUBMIT A TEST ====================
exports.submitTest = catchAsync(async (req, res, next) => {
  const candidateData = filterObj(req.body, "name", "email", "score");

  const existing = await Result.findOne({
    testID: req.params.id,
    "candidate.email": candidateData.email,
  });

  if (existing) {
    return next(new AppError("You have already submitted the test", 400));
  }

  const result = await Result.updateOne(
    { testID: req.params.id },
    { $push: { candidate: candidateData } }
  );

  res.status(200).json({
    status: "success",
    message: "Result added successfully",
    data: { result },
  });
});

// ==================== CREATE A NEW TEST ====================
exports.createTest = catchAsync(async (req, res, next) => {
  // console.log("inside create");

  const testObj = req.body;
  const key = short.generate();
  testObj.key = key;
  testObj.createdBy = req.user.id;

  // console.log(key);

  const newTest = await Test.create(testObj);
  newTest.active = undefined;

  await Result.create({
    testName: newTest.name,
    testID: newTest._id,
    testKey: key,
    createdBy: req.user.id,
  });

  res.status(201).json({
    status: "success",
    message: "Test created successfully",
    data: { test: newTest },
  });
});

// ==================== UPDATE MY OWN TEST ====================
exports.updateMyTest = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.testID);
  if (!test) return next(new AppError("No test found with that ID", 400));
  if (test.createdBy !== req.user.id) {
    return next(new AppError("You do not have permission", 403));
  }

  const filteredBody = filterObj(
    req.body,
    "name",
    "email",
    "company",
    "Question",
    "duration"
  );

  const updatedTest = await Test.findByIdAndUpdate(test._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  updatedTest.active = undefined;

  res.status(200).json({
    status: "success",
    message: "Test updated successfully",
    data: { test: updatedTest },
  });
});

// ==================== UPDATE ANY TEST (ADMIN ONLY) ====================
exports.updateTest = catchAsync(async (req, res, next) => {
  const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!test) return next(new AppError("No test found with that ID", 404));

  test.active = undefined;

  res.status(200).json({
    status: "success",
    message: "Test updated successfully",
    data: { test },
  });
});

// ==================== DELETE MY OWN TEST ====================
exports.deleteMyTest = catchAsync(async (req, res, next) => {
  const test = await Test.findById(req.params.testID);
  if (!test) return next(new AppError("No test found with that ID", 400));
  if (test.createdBy !== req.user.id) {
    return next(new AppError("You do not have permission", 403));
  }

  await Test.findByIdAndUpdate(test._id, { active: false });

  res.status(204).json({
    status: "success",
    message: "Test deleted successfully",
    data: null,
  });
});

// ==================== DELETE ANY TEST (ADMIN ONLY) ====================
exports.deleteTest = catchAsync(async (req, res, next) => {
  const test = await Test.findByIdAndDelete(req.params.id);
  if (!test) return next(new AppError("No test found with that ID", 404));

  res.status(200).json({
    status: "success",
    message: "Test deleted successfully",
    data: null,
  });
});

// Execute Python, JavaScript Code
exports.executeCode = catchAsync(async (req, res, next) => {
  try {
    const { language, version, files } = req.body;

    if (!language || !files?.length || !files[0]?.content) {
      return res.status(400).json({
        error: "Invalid request: language and file content are required.",
      });
    }

    const requestData = {
      language,
      version,
      files: files.map((file) => ({
        content: file.content,
      })),
    };

    const endpoint = "https://emkc.org/api/v2/piston/execute";
    const { data } = await axios.post(endpoint, requestData);
    const output = data.run.output;

    res.status(200).json(output);
  } catch (error) {
    console.error("Code execution error:", error);
    res.status(500).json({ error: "Code execution failed." });
  }
});
