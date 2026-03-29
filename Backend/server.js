// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

// Trust proxy (important for HTTPS behind Nginx)
app.set('trust proxy', 1);

// JSON parser
app.use(express.json());

// CORS (ONLY frontend allowed)
app.use(cors({
  origin: [
    "https://waterpollution.ionode.cloud", 
    "http://127.0.0.1:5500", 
    "http://localhost:5500",
    "null"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

/* =========================
   MONGODB CONNECTION
========================= */

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* =========================
   SCHEMA & MODEL
========================= */

const riverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  locationName: { type: String, required: true },

  // Water parameters
  pH: { type: Number, required: true },
  tds: { type: Number, required: true },
  turbidity: { type: Number, required: true },
  dissolvedOxygen: { type: Number, required: true },
  waterTemp: { type: Number, required: true },
  waterLevel: { type: Number, required: true },
  envTemp: { type: Number, required: true },
  pressure: { type: Number, required: true },

  // Prediction fields
  prediction: { type: String, default: "Not analyzed" },
  polluted: { type: Boolean, default: false },
  issues: { type: [String], default: [] }

}, { timestamps: true });

const River = mongoose.model("River", riverSchema);

/* =========================
   HELPER FUNCTION
========================= */

function generatePrediction({ pH, tds, turbidity, dissolvedOxygen }) {
  const issues = [];
  let score = 0;

  if (pH < 6.5 || pH > 8.5) { issues.push("pH out of range"); score += 2; }
  if (tds > 500) { issues.push("High TDS"); score += 2; }
  if (turbidity > 20) { issues.push("High turbidity"); score += 1; }
  if (dissolvedOxygen < 5) { issues.push("Low dissolved oxygen"); score += 2; }

  let prediction = "Good Water Quality";

  if (score >= 5) prediction = "Severely Polluted - Immediate Action Required";
  else if (score >= 3) prediction = "Moderately Polluted - Monitoring Required";
  else if (score >= 1) prediction = "Slightly Polluted - Minor Issues";

  return {
    prediction,
    polluted: score > 0,
    issues
  };
}

/* =========================
   ROUTES
========================= */

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Water Pollution API running" });
});

// GET all rivers
app.get("/rivers", async (req, res) => {
  try {
    const rivers = await River.find().sort({ createdAt: -1 });
    res.json(rivers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch rivers" });
  }
});

// GET river by ID
app.get("/rivers/:id", async (req, res) => {
  try {
    const river = await River.findById(req.params.id);
    if (!river) return res.status(404).json({ message: "River not found" });
    res.json(river);
  } catch {
    res.status(400).json({ message: "Invalid ID" });
  }
});

// POST new river
app.post("/rivers", async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || data.lat == null || data.lon == null || !data.locationName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const predictionData = data.prediction
      ? { prediction: data.prediction, polluted: data.polluted, issues: data.issues }
      : generatePrediction(data);

    const river = new River({
      ...data,
      prediction: predictionData.prediction,
      polluted: predictionData.polluted,
      issues: predictionData.issues
    });

    const saved = await river.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update river
app.put("/rivers/:id", async (req, res) => {
  try {
    const updates = req.body;

    if (
      (updates.pH || updates.tds || updates.turbidity || updates.dissolvedOxygen) &&
      !updates.prediction
    ) {
      const old = await River.findById(req.params.id);
      if (!old) return res.status(404).json({ message: "River not found" });

      Object.assign(updates, generatePrediction({
        pH: updates.pH ?? old.pH,
        tds: updates.tds ?? old.tds,
        turbidity: updates.turbidity ?? old.turbidity,
        dissolvedOxygen: updates.dissolvedOxygen ?? old.dissolvedOxygen
      }));
    }

    const updated = await River.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: "River not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE one river
app.delete("/rivers/:id", async (req, res) => {
  try {
    const deleted = await River.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "River not found" });
    res.json({ message: "River deleted" });
  } catch {
    res.status(400).json({ message: "Delete failed" });
  }
});

// DELETE all rivers
app.delete("/rivers", async (req, res) => {
  const result = await River.deleteMany({});
  res.json({ deleted: result.deletedCount });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Water Pollution API running on port ${PORT}`);
});
