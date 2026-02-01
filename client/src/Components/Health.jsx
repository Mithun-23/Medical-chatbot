import { useState, useEffect, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase";
import { ThemeContext } from "./ThemeContext";
import { axiosClient } from "../axios";
import {
    Plus, Save, X, Heart, Pill, Activity, Brain,
    FileText, AlertCircle, Stethoscope
} from "lucide-react";
import ReportUpload from "./ReportUpload";

const Health = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Medical profile
    const [conditions, setConditions] = useState([]);
    const [medications, setMedications] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [notes, setNotes] = useState("");
    const [newCondition, setNewCondition] = useState("");
    const [newMedication, setNewMedication] = useState({ name: "", dosage: "" });
    const [newAllergy, setNewAllergy] = useState("");
    const [saveStatus, setSaveStatus] = useState(null);

    const { isDarkMode } = useContext(ThemeContext);

    // Load medical profile
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userId = localStorage.getItem("Email");
                if (userId) {
                    try {
                        const res = await axiosClient.get(`/api/medical-profile?userId=${encodeURIComponent(userId)}`);
                        if (res.data) {
                            setConditions(res.data.healthConditions || []);
                            setMedications(res.data.medications || []);
                            setAllergies(res.data.allergies || []);
                            setNotes(res.data.notes || "");
                        }
                    } catch (err) {
                        console.error("Error fetching medical profile:", err);
                    }
                }
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Save medical profile
    const saveMedicalProfile = async () => {
        const userId = localStorage.getItem("Email");
        if (!userId) return;
        try {
            await axiosClient.post("/api/medical-profile", {
                userId, healthConditions: conditions, medications, allergies, notes
            });
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error("Error saving:", err);
            setSaveStatus("error");
        }
    };

    // Add condition
    const addCondition = async () => {
        if (!newCondition.trim()) return;
        const userId = localStorage.getItem("Email");
        try {
            const res = await axiosClient.post("/api/medical-profile/condition", {
                userId, condition: newCondition.trim()
            });
            setConditions(res.data.healthConditions);
            setNewCondition("");
        } catch (err) { console.error(err); }
    };

    // Remove condition
    const removeCondition = async (id) => {
        const userId = localStorage.getItem("Email");
        try {
            const res = await axiosClient.delete("/api/medical-profile/condition", {
                data: { userId, conditionId: id }
            });
            setConditions(res.data.healthConditions);
        } catch (err) { console.error(err); }
    };

    // Add medication
    const addMedication = async () => {
        if (!newMedication.name.trim()) return;
        const userId = localStorage.getItem("Email");
        try {
            const res = await axiosClient.post("/api/medical-profile/medication", {
                userId, name: newMedication.name.trim(), dosage: newMedication.dosage.trim()
            });
            setMedications(res.data.medications);
            setNewMedication({ name: "", dosage: "" });
        } catch (err) { console.error(err); }
    };

    // Remove medication
    const removeMedication = async (id) => {
        const userId = localStorage.getItem("Email");
        try {
            const res = await axiosClient.delete("/api/medical-profile/medication", {
                data: { userId, medicationId: id }
            });
            setMedications(res.data.medications);
        } catch (err) { console.error(err); }
    };

    // Add allergy
    const addAllergy = () => {
        if (!newAllergy.trim()) return;
        setAllergies([...allergies, newAllergy.trim()]);
        setNewAllergy("");
    };

    // Remove allergy
    const removeAllergy = (index) => {
        setAllergies(allergies.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                        <Stethoscope className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            My Health Profile
                        </h1>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            This data helps Dr.Chat provide personalized responses
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column - Conditions & Medications */}
                <div className="space-y-6">

                    {/* Health Conditions */}
                    <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-red-500/20" : "bg-white/80 backdrop-blur-sm border border-red-200"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                <Heart className="w-5 h-5 text-red-400" />
                                Health Conditions
                            </h2>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <input
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addCondition()}
                                placeholder="e.g., Diabetes, Asthma, Hypertension"
                                className={`flex-1 px-4 py-3 rounded-xl outline-none ${isDarkMode ? "bg-slate-700 text-white placeholder-gray-400 border border-red-500/30" : "bg-gray-100 text-gray-900 border border-red-200"}`}
                            />
                            <button onClick={addCondition} className="px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {conditions.length > 0 ? conditions.map((c, i) => (
                                <span key={c._id || i} className={`group px-4 py-2 rounded-full flex items-center gap-2 ${isDarkMode ? "bg-red-900/50 text-red-200" : "bg-red-100 text-red-700"}`}>
                                    <Activity className="w-4 h-4" />
                                    {c.condition}
                                    <button onClick={() => removeCondition(c._id)} className="opacity-0 group-hover:opacity-100 transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            )) : (
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    No conditions added. Add your health conditions for personalized support.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Medications */}
                    <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-blue-500/20" : "bg-white/80 backdrop-blur-sm border border-blue-200"}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
                            <Pill className="w-5 h-5" /> Current Medications
                        </h3>

                        <div className="flex gap-2 mb-4">
                            <input
                                value={newMedication.name}
                                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                                placeholder="Medication name"
                                className={`flex-1 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                            />
                            <input
                                value={newMedication.dosage}
                                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                                placeholder="Dosage"
                                className={`w-28 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                            />
                            <button onClick={addMedication} className="px-4 py-3 bg-blue-500 text-white rounded-xl flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {medications.length > 0 ? medications.map((m, i) => (
                                <span key={m._id || i} className={`group px-4 py-2 rounded-full flex items-center gap-2 ${isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                                    <Pill className="w-4 h-4" />
                                    {m.name} {m.dosage && <span className="opacity-60">({m.dosage})</span>}
                                    <button onClick={() => removeMedication(m._id)} className="opacity-0 group-hover:opacity-100 transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            )) : (
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    No medications added. Add your current medications for safety advice.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Allergies */}
                    <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-yellow-500/20" : "bg-white/80 backdrop-blur-sm border border-yellow-200"}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>
                            <AlertCircle className="w-5 h-5" /> Allergies
                        </h3>

                        <div className="flex gap-2 mb-4">
                            <input
                                value={newAllergy}
                                onChange={(e) => setNewAllergy(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                                placeholder="e.g., Penicillin, Peanuts"
                                className={`flex-1 px-4 py-3 rounded-xl ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                            />
                            <button onClick={addAllergy} className="px-4 py-3 bg-yellow-500 text-white rounded-xl flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {allergies.length > 0 ? allergies.map((a, i) => (
                                <span key={i} className={`group px-4 py-2 rounded-full flex items-center gap-2 ${isDarkMode ? "bg-yellow-900/50 text-yellow-200" : "bg-yellow-100 text-yellow-700"}`}>
                                    <AlertCircle className="w-4 h-4" />
                                    {a}
                                    <button onClick={() => removeAllergy(i)} className="opacity-0 group-hover:opacity-100 transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </span>
                            )) : (
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    No allergies added. Important for medication safety.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes + Save */}
                    <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-green-500/20" : "bg-white/80 backdrop-blur-sm border border-green-200"}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                            <Brain className="w-5 h-5" /> Additional Notes
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any other health info Dr.Chat should know about (surgeries, family history, etc.)"
                            className={`w-full px-4 py-3 rounded-xl text-sm h-24 resize-none ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                        />
                        <button
                            onClick={saveMedicalProfile}
                            className={`mt-4 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                ${saveStatus === "saved"
                                    ? "bg-green-500 text-white"
                                    : saveStatus === "error"
                                        ? "bg-red-500 text-white"
                                        : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                                }`}
                        >
                            <Save className="w-4 h-4" />
                            {saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error" : "Save Health Profile"}
                        </button>
                    </div>
                </div>

                {/* Right Column - Medical Reports */}
                <div className="space-y-6">
                    <ReportUpload />

                    {/* Info Card */}
                    <div className={`rounded-2xl p-6 ${isDarkMode ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30" : "bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200"}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 mb-3 ${isDarkMode ? "text-purple-300" : "text-purple-700"}`}>
                            <FileText className="w-5 h-5" /> How This Helps
                        </h3>
                        <ul className={`space-y-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">✅</span>
                                <span>Dr.Chat references your conditions and medications in conversations</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">✅</span>
                                <span>Uploaded reports are analyzed by AI for key findings</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">✅</span>
                                <span>Voice assistant provides personalized health guidance</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1">⚠️</span>
                                <span>This is not a substitute for professional medical advice</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Health;
