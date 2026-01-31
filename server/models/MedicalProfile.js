const mongoose = require("mongoose");

const MedicalProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    healthConditions: [{
        condition: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'moderate'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    allergies: [String],
    bloodType: String,
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    notes: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Auto-update lastUpdated on save
MedicalProfileSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model("MedicalProfile", MedicalProfileSchema);
