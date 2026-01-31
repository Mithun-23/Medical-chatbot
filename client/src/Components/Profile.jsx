import { useState, useEffect, useContext } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./Firebase";
import { auth } from "./Firebase";
import { ThemeContext } from "./ThemeContext";
import { axiosClient } from "../axios";
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Save, Edit2,
  Pill, Activity, Heart, User, X, Stethoscope,
  Clock, TrendingUp, FileHeart, Brain
} from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile form
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  // Medical profile
  const [conditions, setConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [notes, setNotes] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState({ name: "", dosage: "" });

  // Check-in
  const [checkInData, setCheckInData] = useState({
    checkInDates: [], currentStreak: 0, longestStreak: 0,
    daysInMonth: 31, firstDayOfWeek: 0
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Chat history
  const [chatHistory, setChatHistory] = useState([]);

  const { isDarkMode } = useContext(ThemeContext);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  // Load user + medical profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || "");
        setEmail(currentUser.email || "");

        // Firestore data
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setPhone(docSnap.data().phone || "");
          setDob(docSnap.data().dob || "");
        }

        // Medical profile
        const userId = localStorage.getItem("Email");
        if (userId) {
          try {
            const res = await axiosClient.get(`/api/medical-profile?userId=${encodeURIComponent(userId)}`);
            if (res.data) {
              setConditions(res.data.healthConditions || []);
              setMedications(res.data.medications || []);
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

  // Check-ins
  useEffect(() => {
    const fetchCheckIns = async () => {
      const userId = localStorage.getItem("Email");
      if (!userId) return;
      try {
        const res = await axiosClient.get(`/api/checkins?userId=${encodeURIComponent(userId)}&month=${currentMonth}&year=${currentYear}`);
        if (res.data) setCheckInData(res.data);
      } catch (err) { }
    };
    fetchCheckIns();
  }, [currentMonth, currentYear]);

  // Chat history
  useEffect(() => {
    const fetchChats = async () => {
      const userId = localStorage.getItem("Email");
      if (!userId) return;
      try {
        const res = await axiosClient.get(`/api/sessions?userId=${encodeURIComponent(userId)}`);
        setChatHistory(res.data || []);
      } catch (err) { }
    };
    fetchChats();
  }, []);

  // Save medical profile
  const saveMedicalProfile = async () => {
    const userId = localStorage.getItem("Email");
    if (!userId) return;
    try {
      await axiosClient.post("/api/medical-profile", {
        userId, healthConditions: conditions, medications, notes
      });
    } catch (err) {
      console.error("Error saving:", err);
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
    } catch (err) { }
  };

  // Remove condition
  const removeCondition = async (id) => {
    const userId = localStorage.getItem("Email");
    try {
      const res = await axiosClient.delete("/api/medical-profile/condition", {
        data: { userId, conditionId: id }
      });
      setConditions(res.data.healthConditions);
    } catch (err) { }
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
    } catch (err) {
      console.error("Error adding medication:", err);
    }
  };

  // Remove medication
  const removeMedication = async (id) => {
    const userId = localStorage.getItem("Email");
    try {
      const res = await axiosClient.delete("/api/medical-profile/medication", {
        data: { userId, medicationId: id }
      });
      setMedications(res.data.medications);
    } catch (err) {
      console.error("Error removing medication:", err);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    const userRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userRef, { phone, dob }, { merge: true });
    await saveMedicalProfile();
    setIsEditing(false);
  };

  // Calendar helpers
  const goToPrev = () => {
    setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1);
    if (currentMonth === 0) setCurrentYear(currentYear - 1);
  };
  const goToNext = () => {
    const today = new Date();
    if (currentYear === today.getFullYear() && currentMonth >= today.getMonth()) return;
    setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1);
    if (currentMonth === 11) setCurrentYear(currentYear + 1);
  };
  const isCheckedIn = (day) => {
    const str = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return checkInData.checkInDates?.includes(str);
  };
  const isToday = (day) => {
    const t = new Date();
    return day === t.getDate() && currentMonth === t.getMonth() && currentYear === t.getFullYear();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>

      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {name || "Guest"}
            </h1>
            <p className={`${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>{email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"}`}>
                🔥 {checkInData.currentStreak} day streak
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Health Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Health Conditions - Main Card */}
          <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-purple-500/20" : "bg-white/80 backdrop-blur-sm border border-purple-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <Heart className="w-5 h-5 text-red-400" />
                My Health Conditions
              </h2>
              <span className={`text-sm ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>
                Chatbot will remember these
              </span>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCondition()}
                placeholder="Type condition (e.g., Diabetes, Asthma)"
                className={`flex-1 px-4 py-3 rounded-xl outline-none ${isDarkMode ? "bg-slate-700 text-white placeholder-gray-400 border border-purple-500/30" : "bg-gray-100 text-gray-900 border border-purple-200"}`}
              />
              <button onClick={addCondition} className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {conditions.length > 0 ? conditions.map((c, i) => (
                <span key={c._id || i} className={`group px-4 py-2 rounded-full flex items-center gap-2 ${isDarkMode ? "bg-purple-900/50 text-purple-200" : "bg-purple-100 text-purple-700"}`}>
                  <Activity className="w-4 h-4" />
                  {c.condition}
                  <button onClick={() => removeCondition(c._id)} className="opacity-0 group-hover:opacity-100 transition">
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </span>
              )) : (
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No conditions added. Add your health conditions so Dr.Chat can provide personalized support.</p>
              )}
            </div>
          </div>

          {/* Medications */}
          <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-blue-500/20" : "bg-white/80 backdrop-blur-sm border border-blue-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
                <Pill className="w-4 h-4" /> Medications
              </h3>
              <span className={`text-sm ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}>
                Chatbot will remember these
              </span>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                value={newMedication.name}
                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                placeholder="Medication name"
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
              />
              <input
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                placeholder="Dosage"
                className={`w-24 px-3 py-2 rounded-lg text-sm ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
              />
              <button onClick={addMedication} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {medications.length > 0 ? medications.map((m, i) => (
                <span key={m._id || i} className={`group px-4 py-2 rounded-full flex items-center gap-2 ${isDarkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                  <Pill className="w-4 h-4" />
                  {m.name} {m.dosage && <span className="opacity-60">({m.dosage})</span>}
                  <button onClick={() => removeMedication(m._id)} className="opacity-0 group-hover:opacity-100 transition">
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </span>
              )) : (
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No medications added. Add your current medications so Dr.Chat can provide better advice.</p>
              )}
            </div>
          </div>

          {/* Notes + Save */}
          <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-green-500/20" : "bg-white/80 backdrop-blur-sm border border-green-200"}`}>
            <h3 className={`font-bold flex items-center gap-2 mb-3 ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
              <Brain className="w-4 h-4" /> Additional Notes for Dr.Chat
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other health info the chatbot should know about..."
              className={`w-full px-4 py-3 rounded-xl text-sm h-20 resize-none ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
            />
            <button onClick={saveMedicalProfile} className="mt-3 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Health Profile
            </button>
          </div>
        </div>

        {/* Right Column - Streak Calendar + Recent Chats */}
        <div className="space-y-6">

          {/* Streak Calendar */}
          <div className={`rounded-2xl p-5 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-orange-500/20" : "bg-white/80 backdrop-blur-sm border border-orange-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? "text-orange-300" : "text-orange-700"}`}>
                <TrendingUp className="w-4 h-4" /> Check-in Streak
              </h3>
              <span className={`text-2xl font-bold ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                🔥 {checkInData.currentStreak}
              </span>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={goToPrev} className="p-1 rounded hover:bg-gray-500/20">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">{monthNames[currentMonth]} {currentYear}</span>
              <button onClick={goToNext} className="p-1 rounded hover:bg-gray-500/20">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
              {dayNames.map(d => <span key={d} className="opacity-50">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: checkInData.firstDayOfWeek }).map((_, i) => <div key={`e${i}`} className="w-7 h-7" />)}
              {Array.from({ length: checkInData.daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <div key={day} className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition
                    ${isCheckedIn(day) ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white" : isDarkMode ? "bg-slate-700 text-gray-400" : "bg-gray-100 text-gray-600"}
                    ${isToday(day) ? "ring-2 ring-blue-400" : ""}
                  `}>
                    {day}
                  </div>
                );
              })}
            </div>
            <p className={`text-xs mt-2 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Best: {checkInData.longestStreak} days
            </p>
          </div>

          {/* Recent Conversations */}
          <div className={`rounded-2xl p-5 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-blue-500/20" : "bg-white/80 backdrop-blur-sm border border-blue-200"}`}>
            <h3 className={`font-bold flex items-center gap-2 mb-3 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
              <Stethoscope className="w-4 h-4" /> Recent Chats
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chatHistory.slice(0, 5).map((c, i) => (
                <div key={i} className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                  <p className="text-sm font-medium truncate">{c.title || "Chat"}</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{c.date || "Recent"}</p>
                </div>
              ))}
              {chatHistory.length === 0 && (
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No chats yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
