const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const MedicalReport = require("../models/MedicalReport");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/reports");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `report-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload a medical report
router.post("/reports/upload", upload.single("report"), async (req, res) => {
    try {
        const { userId, reportType } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const report = new MedicalReport({
            userId,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            filePath: req.file.path,
            fileSize: req.file.size,
            reportType: reportType || 'other',
            analysisStatus: 'pending'
        });

        await report.save();
        console.log(`✅ Report uploaded: ${report.fileName} for user ${userId}`);

        // Start analysis asynchronously
        analyzeReportAsync(report._id);

        res.status(201).json({
            message: "Report uploaded successfully",
            report: {
                id: report._id,
                fileName: report.originalName,
                reportType: report.reportType,
                analysisStatus: report.analysisStatus,
                uploadedAt: report.uploadedAt
            }
        });
    } catch (error) {
        console.error("❌ Error uploading report:", error);
        res.status(500).json({ error: "Failed to upload report" });
    }
});

// Async function to analyze report
async function analyzeReportAsync(reportId) {
    try {
        // Update status to analyzing
        await MedicalReport.findByIdAndUpdate(reportId, { analysisStatus: 'analyzing' });

        const report = await MedicalReport.findById(reportId);
        if (!report) return;

        // Read file and convert to base64
        const fileBuffer = fs.readFileSync(report.filePath);
        const base64File = fileBuffer.toString('base64');

        // Determine media type for the API
        let mediaType = report.fileType;
        if (report.fileType === 'application/pdf') {
            // For PDFs, we'll extract first page as image or send as-is
            mediaType = 'application/pdf';
        }

        // Call Python server for analysis
        const response = await axios.post('http://localhost:5000/api/analyze-report', {
            file: base64File,
            fileType: report.fileType,
            fileName: report.originalName,
            reportType: report.reportType
        }, {
            timeout: 120000 // 2 minute timeout for AI analysis
        });

        const analysis = response.data;

        // Update report with analysis
        await MedicalReport.findByIdAndUpdate(reportId, {
            analysis: {
                summary: analysis.summary || '',
                findings: analysis.findings || [],
                concerns: analysis.concerns || [],
                recommendations: analysis.recommendations || [],
                doctorQuestions: analysis.doctorQuestions || [],
                rawAnalysis: analysis.rawAnalysis || ''
            },
            analysisStatus: 'completed',
            analyzedAt: new Date()
        });

        console.log(`✅ Analysis completed for report ${reportId}`);
    } catch (error) {
        console.error(`❌ Analysis failed for report ${reportId}:`, error.message);
        await MedicalReport.findByIdAndUpdate(reportId, {
            analysisStatus: 'failed',
            analysisError: error.message
        });
    }
}

// Get all reports for a user
router.get("/reports", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const reports = await MedicalReport.find({ userId })
            .sort({ uploadedAt: -1 })
            .select('-filePath -analysis.rawAnalysis');

        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// Get a specific report with full analysis
router.get("/reports/:reportId", async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const report = await MedicalReport.findOne({ _id: reportId, userId });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        res.json(report);
    } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ error: "Failed to fetch report" });
    }
});

// Re-analyze a report
router.post("/reports/:reportId/analyze", async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const report = await MedicalReport.findOne({ _id: reportId, userId });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        // Reset analysis status and trigger re-analysis
        await MedicalReport.findByIdAndUpdate(reportId, {
            analysisStatus: 'pending',
            analysisError: null
        });

        analyzeReportAsync(reportId);

        res.json({ message: "Re-analysis started", reportId });
    } catch (error) {
        console.error("Error re-analyzing report:", error);
        res.status(500).json({ error: "Failed to re-analyze report" });
    }
});

// Delete a report
router.delete("/reports/:reportId", async (req, res) => {
    try {
        const { reportId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const report = await MedicalReport.findOne({ _id: reportId, userId });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        // Delete file from disk
        if (fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
        }

        // Delete from database
        await MedicalReport.findByIdAndDelete(reportId);

        console.log(`✅ Report deleted: ${reportId}`);
        res.json({ message: "Report deleted successfully" });
    } catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({ error: "Failed to delete report" });
    }
});

// Get report context for chatbot (simplified format)
router.get("/reports/context", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const reports = await MedicalReport.find({
            userId,
            analysisStatus: 'completed'
        }).sort({ uploadedAt: -1 }).limit(5);

        if (reports.length === 0) {
            return res.json({ context: "", reports: [] });
        }

        // Build context string for chatbot
        let contextParts = [];

        reports.forEach((report, index) => {
            let reportContext = `Report ${index + 1} (${report.reportType}, ${new Date(report.uploadedAt).toLocaleDateString()}):`;

            if (report.analysis?.summary) {
                reportContext += ` ${report.analysis.summary}`;
            }

            if (report.analysis?.findings?.length > 0) {
                const keyFindings = report.analysis.findings
                    .filter(f => f.status !== 'normal')
                    .map(f => `${f.name}: ${f.value} (${f.status})`)
                    .slice(0, 5)
                    .join(", ");
                if (keyFindings) {
                    reportContext += ` Key findings: ${keyFindings}.`;
                }
            }

            if (report.analysis?.concerns?.length > 0) {
                const concerns = report.analysis.concerns.map(c => c.concern).join(", ");
                reportContext += ` Concerns: ${concerns}.`;
            }

            contextParts.push(reportContext);
        });

        res.json({
            context: contextParts.join(" "),
            reportCount: reports.length
        });
    } catch (error) {
        console.error("Error getting report context:", error);
        res.status(500).json({ error: "Failed to get report context" });
    }
});

module.exports = router;
