# CODE QUEST API

A Node.js-based RESTful API for managing user authentication, test results, and admin control features. Built using **Express**, **MongoDB (Mongoose)**, and **JWT-based authentication**, this API serves as the backend for a test/result management or assessment system.

---

## 🔧 Features

-   User Authentication (Signup/Login/Forgot & Reset Password)
-   Role-based Access Control (admin/user)
-   Create, Retrieve, Update, Delete (CRUD) for Test Results
-   Secure Password Updates
-   Soft Delete for Users
-   JWT Token Authentication
-   Centralized Error Handling

---

## 📦 Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/SyedShamaan2000/CodeQuest-backend.git
    cd CodeQuest-backend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up environment variables**  
   Create a `.env` (refer .env.reference) file in the root directory and add the following:

    ```env
    # MongoDB template for dynamic password replacement (Use Your Mongo URL)
    DATABASE = "mongodb+srv://<USERNAME>:<PASSWORD>@test-app.vxaypki.mongodb.net/?retryWrites=true&w=majority&appName=test-app"
    DATABASE_PASSWORD = ""

    # JWT authentication
    JWT_SECRET_KEY="your_jwt_secret_key"            # Used to sign and verify JWT tokens
    JWT_EXPIRES_IN=36000000

    # Server
    PORT=5000                                        # Port where the server will run

    # Email configuration for nodemailer
    EMAIL_HOST=smtp.example.com                      # SMTP host (e.g., smtp.gmail.com)
    EMAIL_PORT=587                                   # SMTP port (587 for TLS, 465 for SSL)
    EMAIL_USERNAME=your-email@example.com            # Your SMTP/email username
    EMAIL_PASSWORD=your-email-password               # Your SMTP/email password

    EMAIL_FROM = "Something/Name <noreply@example.com>"
    ```

4. **Start the server**
    ```bash
    npm start
    ```

---

## 📁 Folder Structure

```
.
├── controllers/       # All route controllers
├── models/            # Mongoose schemas
├── routes/            # Express route handlers
├── utils/             # Helper functions (e.g., AppError, email)
├── server.js          # Entry point
└── .env               # Environment variables
```

---

## 🔐 Environment Variable Breakdown

| Variable            | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `DATABASE`          | Template connection string with `<PASSWORD>` placeholder (optional) |
| `DATABASE_PASSWORD` | MongoDB user password used in `DATABASE` string                     |
| `JWT_SECRET_KEY`    | Secret key used to sign JWT tokens                                  |
| `JWT_EXPIRES_IN`    | Expiration time for JWT in **seconds** (e.g., 36000 = 10 hours)     |
| `PORT`              | The port the server listens on                                      |

---
