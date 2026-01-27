import { useState, useEffect, useContext } from "react";
import { onAuthStateChanged, getIdToken, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./Firebase";
import { auth } from "./Firebase";
import { FaEdit, FaSave, FaPlus } from "react-icons/fa";
import { ThemeContext } from "./ThemeContext";
import axios from "axios";
import Sidebar from "./Sidebar";
import { X, Trash2, Calendar } from "lucide-react";
import ChatHistory from "./ChatHistory";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [activeDays, setActiveDays] = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [mood, setMood] = useState("😊 Happy");
  const { isDarkMode } = useContext(ThemeContext);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Guest");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [monthName, setMonthName] = useState('');

  const currentSessionId = { sessionId }
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.displayName || "Guest");

        // Fetch phone and dob from Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setPhone(docSnap.data().phone || "");
          setDob(docSnap.data().dob || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("chatSessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem("chatSessionId", newSessionId);
    }
  }, []);

  useEffect(() => {
    const fetchChatHistory = async (sessionId) => {
      try {
        const userId = localStorage.getItem("Email"); // Get user email
        const response = await fetch(`https://medical-chatbot-02.onrender.com/api/sessions?userId=${encodeURIComponent(userId)}`);

        if (!response.ok) {
          throw new Error("Failed to fetch chat history");
        }

        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, []);




  const fetchActiveDays = async (currentUser) => {
    try {
      const token = await getIdToken(currentUser);
      const userEmail = encodeURIComponent(currentUser.email);

      const response = await axios.get(`https://medical-chatbot-02.onrender.com/chat/active-days?userId=${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        const activeDates = response.data.activeDays.map(dateStr => new Date(dateStr));

        // Extract day numbers
        const activeDaysArray = activeDates.map(date => date.getDate());

        // Get month name from the first active date (assuming all are from the same month)
        const monthName = activeDates.length > 0 ? activeDates[0].toLocaleString('default', { month: 'long' }) : '';

        setActiveDays(activeDaysArray || []);
        setTotalDays(response.data.totalDays || 0);
        setMonthName(monthName); // Store the month name
      }
    } catch (error) {
      console.error("Error fetching active days:", error);
    }
  };


  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchActiveDays(user); // Call the modified function
      }
    });
  }, []);


 

  const loadChat = async (selectedSessionId) => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem("Email");

      const response = await fetch(`https://medical-chatbot-02.onrender.com/api/chat/${selectedSessionId}?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error("Failed to fetch chat history");

      const chatData = await response.json();

      // Update the session ID
      setSessionId(selectedSessionId);
      localStorage.setItem("chatSessionId", selectedSessionId);
      const selectedChat = chatHistory.find(chat => chat.id === selectedSessionId);
      if (selectedChat) {
        setCurrentSessionTitle(selectedChat.title);
      }

      // Format messages if they're not already in the right format
      const formattedMessages = Array.isArray(chatData.messages)
        ? chatData.messages
        : chatData.map(msg => ({
          text: msg.content || msg.text,
          sender: msg.role === 'user' ? 'user' : 'bot'
        }));

      if (formattedMessages.length === 0) {
        // If no messages, initialize with empty array but set isFirstMessageSent to false
        setMessages([]);
        setIsFirstMessageSent(false);
      } else {
        setMessages(formattedMessages);
        setIsFirstMessageSent(true);
      }

      // Close chat history panel
      setShowChatHistory(false);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setError("Failed to load chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const fetchSentiment = async () => {
    const userId = localStorage.getItem("Email");
    const sessionId = localStorage.getItem("chatSessionId");

    if (!userId || !sessionId) {
      console.error("❌ Missing required data.");
      return;
    }

    try {
      const response = await fetch("https://medical-chatbot-02.onrender.com/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          sessionId,
          messages: [{ sender: "user", text: "Hello!" }] // Sample message
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.chatReport?.sentiment) {
        console.warn("⚠️ No sentiment data received.");
        return;
      }

      console.log("✅ Sentiment:", data.chatReport.sentiment);
      setSentiment(data.chatReport.sentiment);

    } catch (error) {
      console.error("❗ Error fetching sentiment:", error.message || error);
    }
  };

  // Fetch sentiment when component mounts
  useEffect(() => {
    fetchSentiment();
  }, []);


  const handleSave = async () => {
    if (auth.currentUser) {
      try {
        // Update Firebase Auth profile (only name is supported)
        await updateProfile(auth.currentUser, { displayName: name });

        // Save phone and dob in Firestore
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, { phone, dob }, { merge: true });
        console.log(phone)
        localStorage.setItem("phone",phone)
        // Refresh user data
        onAuthStateChanged(auth, (updatedUser) => {
          if (updatedUser) {
            setUser(updatedUser);
          }
        });

        setIsEditing(false);
        console.log("Profile updated successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };




  return (
    <div className={`flex min-h-screen  ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <Sidebar />

      <div className="flex-1 px-25 pt-10 mb-5 flex flex-col">
        <div className="flex flex-col items-start mb-6">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          )}
          <h2 className="text-2xl font-semibold">{name}</h2>
        </div>

        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className={`p-6 rounded-lg shadow ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <button
                className="text-blue-500 hover:text-blue-700 flex items-center"
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
              >
                {isEditing ? <FaSave className="mr-1" /> : <FaEdit className="mr-1" />}
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Name */}
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-200 text-black"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : (
                  <p className="text-lg font-semibold">{name}</p>
                )}
              </div>

              {/* Email (Non-editable) */}
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-none">{user?.email || "N/A"}</p>
              </div>

              {/* Phone Number */}
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-200 text-black"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-lg font-semibold">{phone || "Not provided"}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                {isEditing ? (
                  <input
                    type="date"
                    className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-200 text-black"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                ) : (
                  <p className="text-lg font-semibold">{dob || "Not provided"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mood & Wellbeing */}
          <div
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 border
            ${isDarkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white border-gray-700"
                : "bg-gradient-to-br from-white to-gray-100 text-gray-900 border-gray-300"}`}
          >
            <h3 className="text-xl font-bold text-center mb-2">🌟 Mood & Wellbeing</h3>
            <p
              className={`text-lg text-center font-medium transition-all duration-300
              ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              <span className="font-semibold">Mood:</span> {sentiment}
            </p>
            <h3 className="text-xl font-semibold">🔥 Daily Check-In</h3>
            <p className="text-lg font-bold">Streak: {totalDays} days</p>
            {/* Month Name Display */}
            <h4 className="mt-4 text-xl font-bold">{monthName}</h4>

            {/* Calendar-like Display */}
            <div className="grid grid-cols-7 gap-2 mt-4">
              {Array.from({ length: 30 }).map((_, index) => {
                const day = index + 1;
                const isChecked = activeDays.includes(day);
                return (
                  <div
                    key={day}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-300
                ${isChecked ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>


        </div>

        {/* Chat History */}
        <div className="w-full max-w-5xl mt-6">
          <div className={`w-full border rounded-lg shadow ${isDarkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between font-semibold ${isDarkMode ? "border-gray-700 bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-800"}`}>
              <h2 className="text-lg">Recent Chats</h2>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={`p-4 border-b cursor-pointer truncate transition-all duration-300 ${isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"} ${currentSessionId === chat.id ? "bg-blue-900/20 text-blue-300 dark:bg-blue-700/40" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-medium text-sm truncate transition-all duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                        {chat.title}
                      </h3>
                    </div>
                    <div className={`flex items-center mt-1 text-xs transition-all duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{chat.date}</span>
                    </div>
                    <p className={`text-xs truncate mt-1 transition-all duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {chat.preview || "Click to load this chat"}
                    </p>
                  </div>
                ))
              ) : (
                <div className={`p-4 text-center transition-all duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <p>No chat history found</p>
                  <p className="text-xs mt-2">Start a new conversation to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;