import { useState, useEffect, useContext } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./Firebase";
import { auth } from "./Firebase";
import { ThemeContext } from "./ThemeContext";
import { axiosClient } from "../axios";
import {
  ChevronLeft, ChevronRight, Save, Edit2,
  User, Phone, Calendar, Users, Scale, Ruler,
  TrendingUp, Stethoscope, Heart
} from "lucide-react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Personal details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "", relation: "" });
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [gender, setGender] = useState("");

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

  // Load user data
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
          const data = docSnap.data();
          setPhone(data.phone || "");
          setDob(data.dob || "");
          setEmergencyContact(data.emergencyContact || { name: "", phone: "", relation: "" });
          setWeight(data.weight || "");
          setHeight(data.height || "");
          setBloodGroup(data.bloodGroup || "");
          setGender(data.gender || "");
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

  // Save profile
  const handleSave = async () => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    const userRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userRef, {
      phone, dob, emergencyContact, weight, height, bloodGroup, gender
    }, { merge: true });
    setIsEditing(false);
  };

  // Calculate age from DOB
  const calculateAge = () => {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
        <div className="flex items-center justify-between">
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
                {calculateAge() && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                    {calculateAge()} years
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all
              ${isEditing
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {isEditing ? <><Save className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
          </button>
        </div>
      </div>

      <div className="p-6 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Personal Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info Card */}
          <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-blue-500/20" : "bg-white/80 backdrop-blur-sm border border-blue-200"}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <User className="w-5 h-5 text-blue-400" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Full Name</label>
                {isEditing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{name || "-"}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className={`text-sm flex items-center gap-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Phone className="w-3 h-3" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{phone || "-"}</p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label className={`text-sm flex items-center gap-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Calendar className="w-3 h-3" /> Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{dob || "-"}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Gender</label>
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className={`mt-1 font-medium capitalize ${isDarkMode ? "text-white" : "text-gray-900"}`}>{gender || "-"}</p>
                )}
              </div>

              {/* Blood Group */}
              <div>
                <label className={`text-sm flex items-center gap-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Heart className="w-3 h-3" /> Blood Group
                </label>
                {isEditing ? (
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{bloodGroup || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Physical Stats */}
          <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-green-500/20" : "bg-white/80 backdrop-blur-sm border border-green-200"}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
              <Scale className="w-5 h-5" />
              Physical Stats
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Weight */}
              <div>
                <label className={`text-sm flex items-center gap-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Scale className="w-3 h-3" /> Weight (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="65"
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {weight ? `${weight} kg` : "-"}
                  </p>
                )}
              </div>

              {/* Height */}
              <div>
                <label className={`text-sm flex items-center gap-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <Ruler className="w-3 h-3" /> Height (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {height ? `${height} cm` : "-"}
                  </p>
                )}
              </div>
            </div>

            {/* BMI Display */}
            {weight && height && (
              <div className={`mt-4 p-4 rounded-xl ${isDarkMode ? "bg-slate-700" : "bg-gray-100"}`}>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Body Mass Index (BMI)</p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  {(weight / ((height / 100) ** 2)).toFixed(1)}
                </p>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? "bg-slate-800/60 backdrop-blur-sm border border-red-500/20" : "bg-white/80 backdrop-blur-sm border border-red-200"}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? "text-red-300" : "text-red-700"}`}>
              <Users className="w-5 h-5" />
              Emergency Contact
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Name</label>
                {isEditing ? (
                  <input
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                    placeholder="Contact name"
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{emergencyContact.name || "-"}</p>
                )}
              </div>
              <div>
                <label className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Phone</label>
                {isEditing ? (
                  <input
                    value={emergencyContact.phone}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{emergencyContact.phone || "-"}</p>
                )}
              </div>
              <div>
                <label className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Relation</label>
                {isEditing ? (
                  <input
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                    placeholder="e.g., Mother, Spouse"
                    className={`w-full px-4 py-3 rounded-xl mt-1 ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                  />
                ) : (
                  <p className={`mt-1 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{emergencyContact.relation || "-"}</p>
                )}
              </div>
            </div>
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
