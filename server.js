// Import dependencies
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./index");

// Load environment variables from config file
dotenv.config({ path: "./config.env" });
dotenv.config();

// Setup MongoDB connection string
const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
);

// Connect to MongoDB
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Database Successfully Connected"))
    .catch((err) => {
        console.error("Database Connection Error:", err);
    });

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
