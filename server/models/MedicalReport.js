const mongoose = require("mongoose");

const MedicalReportSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    reportType: {
        type: String,
        enum: ['blood_test', 'prescription', 'imaging', 'lab_report', 'diagnosis', 'vaccination', 'other'],
        default: 'other'
    },
    analysis: {
        summary: {
            type: String,
            default: ''
        },
        findings: [{
            name: String,
            value: String,
            normalRange: String,
            status: {
                type: String,
                enum: ['normal', 'high', 'low', 'critical', 'unknown'],
                default: 'unknown'
            },
            interpretation: String
        }],
        concerns: [{
            concern: String,
            severity: {
                type: String,
                enum: ['low', 'moderate', 'high'],
                default: 'moderate'
            },
            recommendation: String
        }],
        recommendations: [String],
        doctorQuestions: [String],
        rawAnalysis: String
    },
    analysisStatus: {
        type: String,
        enum: ['pending', 'analyzing', 'completed', 'failed'],
        default: 'pending'
    },
    analysisError: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    analyzedAt: Date
});

// Index for efficient querying
MedicalReportSchema.index({ userId: 1, uploadedAt: -1 });

module.exports = mongoose.model("MedicalReport", MedicalReportSchema);
