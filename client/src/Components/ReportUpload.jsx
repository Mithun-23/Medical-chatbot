import React, { useState, useCallback, useContext, useEffect } from 'react';
import { ThemeContext } from './ThemeContext';
import { axiosClient } from '../axios';
import {
    FiUploadCloud,
    FiFile,
    FiCheckCircle,
    FiAlertCircle,
    FiLoader,
    FiTrash2,
    FiChevronDown,
    FiChevronUp,
    FiRefreshCw,
    FiFileText,
    FiImage
} from 'react-icons/fi';

export default function ReportUpload() {
    const { isDarkMode } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [expandedReport, setExpandedReport] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const userId = localStorage.getItem('Email');

    // Fetch existing reports on mount
    useEffect(() => {
        if (userId) {
            fetchReports();
        }
    }, [userId]);

    const fetchReports = async () => {
        try {
            const response = await axiosClient.get(`/api/reports?userId=${encodeURIComponent(userId)}`);
            setReports(response.data);
        } catch (err) {
            console.error('Error fetching reports:', err);
        }
    };

    // Poll for analysis updates
    useEffect(() => {
        const pendingReports = reports.filter(r => r.analysisStatus === 'pending' || r.analysisStatus === 'analyzing');
        if (pendingReports.length > 0) {
            const interval = setInterval(fetchReports, 5000);
            return () => clearInterval(interval);
        }
    }, [reports]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        if (!userId) {
            setError('Please log in to upload reports');
            return;
        }

        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
        });

        if (validFiles.length === 0) {
            setError('Please upload PDF or image files (max 10MB)');
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const formData = new FormData();
            formData.append('report', file);
            formData.append('userId', userId);
            formData.append('reportType', detectReportType(file.name));

            try {
                await axiosClient.post('/api/reports/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round(
                            ((i + progressEvent.loaded / progressEvent.total) / validFiles.length) * 100
                        );
                        setUploadProgress(progress);
                    }
                });
            } catch (err) {
                console.error('Upload error:', err);
                setError(`Failed to upload ${file.name}`);
            }
        }

        setIsUploading(false);
        setUploadProgress(0);
        fetchReports();
    };

    const detectReportType = (filename) => {
        const lower = filename.toLowerCase();
        if (lower.includes('blood') || lower.includes('cbc') || lower.includes('hemoglobin')) return 'blood_test';
        if (lower.includes('prescription') || lower.includes('rx')) return 'prescription';
        if (lower.includes('xray') || lower.includes('mri') || lower.includes('ct') || lower.includes('scan')) return 'imaging';
        if (lower.includes('lab') || lower.includes('test')) return 'lab_report';
        if (lower.includes('diagnosis') || lower.includes('report')) return 'diagnosis';
        if (lower.includes('vaccine') || lower.includes('vaccination')) return 'vaccination';
        return 'other';
    };

    const handleDelete = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;

        try {
            await axiosClient.delete(`/api/reports/${reportId}`, {
                data: { userId }
            });
            setReports(prev => prev.filter(r => r._id !== reportId));
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete report');
        }
    };

    const handleReanalyze = async (reportId) => {
        try {
            await axiosClient.post(`/api/reports/${reportId}/analyze`, { userId });
            fetchReports();
        } catch (err) {
            console.error('Re-analyze error:', err);
            setError('Failed to re-analyze report');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
            analyzing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Analyzing...' },
            completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Analyzed' },
            failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Failed' }
        };
        const style = styles[status] || styles.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                {status === 'analyzing' && <FiLoader className="inline animate-spin mr-1" />}
                {style.label}
            </span>
        );
    };

    const getFileIcon = (fileType) => {
        if (fileType?.startsWith('image/')) {
            return <FiImage className="text-purple-500" />;
        }
        return <FiFileText className="text-blue-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'text-red-500';
            case 'moderate': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'critical': return 'text-red-700 bg-red-100 dark:bg-red-900/30 font-bold';
            case 'normal': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700/20';
        }
    };

    return (
        <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <FiUploadCloud className="text-blue-500" />
                Medical Reports
            </h3>

            {/* Upload Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : isDarkMode
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
            >
                <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <FiLoader className="animate-spin text-3xl text-blue-500" />
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Uploading... {uploadProgress}%
                        </p>
                        <div className="w-full max-w-xs h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <FiUploadCloud className="text-3xl text-blue-500" />
                        </div>
                        <div>
                            <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Drag & drop your medical reports
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                or click to browse (PDF, JPEG, PNG - max 10MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <FiAlertCircle />
                    {error}
                </div>
            )}

            {/* Reports List */}
            {reports.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Uploaded Reports ({reports.length})
                    </h4>

                    {reports.map((report) => (
                        <div
                            key={report._id}
                            className={`rounded-xl overflow-hidden border ${isDarkMode
                                ? 'border-gray-700 bg-gray-800/50'
                                : 'border-gray-200 bg-white'
                                }`}
                        >
                            {/* Report Header */}
                            <div
                                className={`p-4 flex items-center justify-between cursor-pointer transition-colors
                                    ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                                onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        {getFileIcon(report.fileType)}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {report.originalName}
                                        </p>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {formatFileSize(report.fileSize)} • {new Date(report.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {getStatusBadge(report.analysisStatus)}
                                    {expandedReport === report._id ? <FiChevronUp /> : <FiChevronDown />}
                                </div>
                            </div>

                            {/* Expanded Analysis */}
                            {expandedReport === report._id && (
                                <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50'}`}>
                                    {report.analysisStatus === 'completed' && report.analysis ? (
                                        <div className="space-y-4">
                                            {/* Summary */}
                                            {report.analysis.summary && (
                                                <div>
                                                    <h5 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Summary
                                                    </h5>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {report.analysis.summary}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Key Findings */}
                                            {report.analysis.findings?.length > 0 && (
                                                <div>
                                                    <h5 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Key Findings
                                                    </h5>
                                                    <div className="grid gap-2">
                                                        {report.analysis.findings.map((finding, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`p-3 rounded-lg ${getStatusColor(finding.status)}`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <span className="font-medium">{finding.name}</span>
                                                                    <span className="text-sm">{finding.value}</span>
                                                                </div>
                                                                {finding.normalRange && (
                                                                    <p className="text-xs opacity-75 mt-1">
                                                                        Normal: {finding.normalRange}
                                                                    </p>
                                                                )}
                                                                {finding.interpretation && (
                                                                    <p className="text-xs mt-1">{finding.interpretation}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Concerns */}
                                            {report.analysis.concerns?.length > 0 && (
                                                <div>
                                                    <h5 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        ⚠️ Concerns
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {report.analysis.concerns.map((concern, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                                                            >
                                                                <p className={`font-medium ${getSeverityColor(concern.severity)}`}>
                                                                    {concern.concern}
                                                                </p>
                                                                {concern.recommendation && (
                                                                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                        💡 {concern.recommendation}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recommendations */}
                                            {report.analysis.recommendations?.length > 0 && (
                                                <div>
                                                    <h5 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        ✅ Recommendations
                                                    </h5>
                                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {report.analysis.recommendations.map((rec, idx) => (
                                                            <li key={idx}>{rec}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Questions for Doctor */}
                                            {report.analysis.doctorQuestions?.length > 0 && (
                                                <div>
                                                    <h5 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        🩺 Questions to Ask Your Doctor
                                                    </h5>
                                                    <ul className={`list-decimal list-inside space-y-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {report.analysis.doctorQuestions.map((q, idx) => (
                                                            <li key={idx}>{q}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : report.analysisStatus === 'failed' ? (
                                        <div className="text-center py-4">
                                            <FiAlertCircle className="text-3xl text-red-500 mx-auto mb-2" />
                                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Analysis failed. {report.analysisError || 'Please try again.'}
                                            </p>
                                            <button
                                                onClick={() => handleReanalyze(report._id)}
                                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                                            >
                                                <FiRefreshCw /> Retry Analysis
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <FiLoader className="text-3xl text-blue-500 animate-spin mx-auto mb-2" />
                                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Analyzing your report like an expert doctor...
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => handleReanalyze(report._id)}
                                            disabled={report.analysisStatus === 'analyzing'}
                                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors
                                                ${isDarkMode
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                } disabled:opacity-50`}
                                        >
                                            <FiRefreshCw /> Re-analyze
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report._id)}
                                            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                        >
                                            <FiTrash2 /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {reports.length === 0 && !isUploading && (
                <div className={`mt-6 text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <FiFile className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>No reports uploaded yet</p>
                    <p className="text-sm">Upload your medical reports for AI-powered analysis</p>
                </div>
            )}
        </div>
    );
}
