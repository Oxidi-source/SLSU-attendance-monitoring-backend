require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "https://slsu-attendance-monitoring-client.vercel.app",
    "http://localhost:3001", // for local development
    "http://localhost:3000", // for local development
    "http://localhost:5173", // for Vite dev server
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "ngrok-skip-browser-warning", // Allow the problematic header
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200, // For legacy browser support
};

// middleware
app.use(cors(corsOptions));

// REMOVE THIS LINE - it's causing the error:
// app.options("*", cors(corsOptions));

app.use(express.json());

//Import routes
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const scheduleRoutes = require("./routes/schedule");
const API_ENDPOINTS = require("./config/endpointconfig");

// it will be localhost /api/ (the path for each routes)
//for example api/attendance/get
//for example api/user/login
app.use(API_ENDPOINTS.MAIN.DEFAULT, attendanceRoutes);
app.use(API_ENDPOINTS.MAIN.DEFAULT, authRoutes);
app.use(API_ENDPOINTS.MAIN.DEFAULT, scheduleRoutes);

app.get("/api", (req, res) => {
  res.json({ message: "Hello from backend" });
});

//connect mongodb
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
