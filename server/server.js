const path = require("path");
// Ensure .env is loaded whether running from server/ or project root
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');

const connectDB = require("./config/db");
const seedAdminUser = require("./config/adminSeed");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const adminRoutes = require("./routes/adminRoutes");
const queryRoutes = require("./routes/queryRoutes");

const { protect } = require("./middleware/authMiddleware");
const { isAdmin } = require("./middleware/adminMiddleware");

const app = express();

// Connect MongoDB & Seed Admin
connectDB().then(() => {
    seedAdminUser();
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/queries", queryRoutes);

// Debug endpoint — lists DB/collection names, so it must never be public
app.get('/api/db/info', protect, isAdmin, async (req, res) => {
  try {
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    const result = [];
    for (const dbInfo of databases) {
      const db = mongoose.connection.useDb(dbInfo.name);
      const collections = await db.db.listCollections().toArray();
      result.push({
        name: dbInfo.name,
        collections: collections.map(col => col.name)
      });
    }
    res.json({ databases: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "ISOI Hackathon API is running 🚀"
    });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});