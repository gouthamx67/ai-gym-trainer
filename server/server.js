const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Models
const Session = require('./models/Session');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Essential for parsing AI data from frontend

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'active', engine: 'AI Gym Trainer Backend' });
});

/**
 * Production Route: Save Workout Session
 * Called by the frontend when a user finishes a set.
 */
app.post('/api/sessions', async (req, res) => {
    try {
        const { exerciseId, count, qualityScore, duration } = req.body;

        const newSession = new Session({
            exerciseId,
            count,
            qualityScore,
            duration
        });

        const savedSession = await newSession.save();
        res.status(201).json(savedSession);
    } catch (err) {
        console.error('Error saving session:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
