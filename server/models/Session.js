const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for now until we add User Auth
    },
    exerciseId: {
        type: String,
        required: true,
        enum: ['curl', 'squat']
    },
    count: {
        type: Number,
        required: true,
        default: 0
    },
    qualityScore: {
        type: Number, // Percentage of reps with good form (0-100)
        default: 100
    },
    duration: {
        type: Number, // Seconds
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Session', SessionSchema);
