// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGO_URI ;

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schema 
const riverSchema = new mongoose.Schema(
  {
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

    // AI Prediction fields - Simplified
    prediction: { type: String, default: 'Not analyzed' },
    polluted: { type: Boolean, default: false },
    issues: { type: [String], default: [] }
  },
  { timestamps: true }
);

const River = mongoose.model('River', riverSchema);

// ---------- HELPER FUNCTION (Optional - for backward compatibility) ----------
function generateprediction(params) {
  const { pH, tds, turbidity, dissolvedOxygen } = params;
  
  const issues = [];
  let severityScore = 0;
  
  if (pH < 6.5 || pH > 8.5) {
    issues.push("pH out of range");
    severityScore += 2;
  }
  if (tds > 500) {
    issues.push("High TDS");
    severityScore += 2;
  }
  if (turbidity > 20) {
    issues.push("High turbidity");
    severityScore += 1;
  }
  if (dissolvedOxygen < 5) {
    issues.push("Low dissolved oxygen");
    severityScore += 2;
  }

  let prediction;
  
  if (severityScore >= 5) {
    prediction = "Severely Polluted - Immediate Action Required";
  } else if (severityScore >= 3) {
    prediction = "Moderately Polluted - Monitoring Recommended";
  } else if (severityScore >= 1) {
    prediction = "Slightly Polluted - Minor Issues Detected";
  } else {
    const isOptimal = pH >= 7.0 && pH <= 8.0 && 
                     tds < 300 && 
                     turbidity < 5 && 
                     dissolvedOxygen >= 7;
    
    if (isOptimal) {
      prediction = "Excellent Water Quality - Safe for All Uses";
    } else {
      prediction = "Good Water Quality - Within Safe Limits";
    }
  }

  return {
    prediction: prediction,
    polluted: severityScore > 0,
    issues
  };
}

// ---------- CRUD ROUTES ----------

// GET all rivers
app.get('/api/rivers', async (req, res) => {
  try {
    const rivers = await River.find().sort({ createdAt: -1 });
    res.json(rivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching rivers' });
  }
});

// GET single river by ID
app.get('/api/rivers/:id', async (req, res) => {
  try {
    const river = await River.findById(req.params.id);
    if (!river) return res.status(404).json({ message: 'River not found' });
    res.json(river);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid ID or server error' });
  }
});

// POST new river - Now accepts simplified prediction fields
app.post('/api/rivers', async (req, res) => {
  try {
    const {
      name, lat, lon, locationName,
      pH, tds, turbidity, dissolvedOxygen,
      waterTemp, waterLevel, envTemp, pressure,
      // Accept prediction fields from request body
      prediction,
      polluted,
      issues
    } = req.body;

    if (!name || lat == null || lon == null || !locationName) {
      return res.status(400).json({ message: 'name, lat, lon, locationName are required' });
    }

    // Use provided prediction fields OR generate them as fallback
    let predictionData = {
      prediction,
      polluted,
      issues
    };

    // If prediction fields are not provided, calculate them
    if (!prediction) {
      predictionData = generateprediction({ pH, tds, turbidity, dissolvedOxygen });
    }

    const river = new River({
      name, lat, lon, locationName,
      pH, tds, turbidity, dissolvedOxygen,
      waterTemp, waterLevel, envTemp, pressure,
      prediction: predictionData.prediction,
      polluted: predictionData.polluted,
      issues: predictionData.issues || []
    });

    const saved = await river.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error creating river', error: err.message });
  }
});

// PUT update river - Accepts prediction fields from request body
app.put('/api/rivers/:id', async (req, res) => {
  try {
    const updates = req.body;

    // If water parameters are updated but NO prediction fields provided,
    // generate predictions automatically
    if ((updates.pH || updates.tds || updates.turbidity || updates.dissolvedOxygen) && 
        !updates.prediction) {
      
      const river = await River.findById(req.params.id);
      if (!river) return res.status(404).json({ message: 'River not found' });

      const updatedParams = {
        pH: updates.pH ?? river.pH,
        tds: updates.tds ?? river.tds,
        turbidity: updates.turbidity ?? river.turbidity,
        dissolvedOxygen: updates.dissolvedOxygen ?? river.dissolvedOxygen
      };

      const prediction = generateprediction(updatedParams);
      Object.assign(updates, prediction);
    }

    const updated = await River.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: 'River not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error updating river', error: err.message });
  }
});

// DELETE single river
app.delete('/api/rivers/:id', async (req, res) => {
  try {
    const deleted = await River.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'River not found' });
    res.json({ message: 'River deleted', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error deleting river', error: err.message });
  }
});

// DELETE all rivers
app.delete('/api/rivers', async (req, res) => {
  try {
    const result = await River.deleteMany({});
    res.json({ message: 'All rivers deleted', deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting rivers', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`River running on http://localhost:${PORT}`);
});
