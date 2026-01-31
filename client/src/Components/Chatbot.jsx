import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHistory from "./ChatHistory";
import '../styles.css';
import { v4 as uuidv4 } from "uuid";
import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import Report from './Report';
import { GoGraph } from "react-icons/go";
import { axiosClient } from "../axios";
import LoginModal from "./LoginModal";
import ActionButton from "./ActionButton";
import EmotionCamera from "./EmotionCamera";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import { Trash2 } from "lucide-react";

export default function Chatbot() {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [inputValue, setInputValue] = useState("");
  const name = localStorage.getItem("Name") || "User";
  const [messages, setMessages] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState('Neutral'); // Add emotion state

  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [currentSessionTitle, setCurrentSessionTitle] = useState("New Chat");
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [userReport, setUserReport] = useState(false);
  const [reportData, setReportData] = useState("");
  // Added missing state variables for camera functionality
  const [cameraActive, setCameraActive] = useState(false);
  const [emotionData, setEmotionData] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Handler for emotion changes from ChatMessages
  const handleEmotionChange = (emotion) => {
    setCurrentEmotion(emotion);
    // Optional: You could also save the emotion to localStorage or other state management if needed
    console.log(`Emotion changed to: ${emotion}`);
  };

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem("chatMessages"));
    if (storedMessages && storedMessages.length > 0) {
      // Mark messages as loaded from storage so they don't trigger animation
      const markedMessages = storedMessages.map(msg => ({ ...msg, _loaded: true }));
      setMessages(markedMessages);

      setIsFirstMessageSent(true);
    } else {
      setMessages([]);
      localStorage.setItem("chatMessages", JSON.stringify([]));
    }
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
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    const userId = localStorage.getItem("Email");
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    try {
      const response = await axiosClient.get(`/api/sessions?userId=${encodeURIComponent(userId)}`);
      const sessions = response.data;

      const formattedSessions = sessions.map(session => ({
        id: session.id || session.sessionId,
        title: session.title || `Chat ${new Date(session.timestamp || session.createdAt).toLocaleDateString()}`,
        date: new Date(session.timestamp || session.createdAt).toLocaleDateString(),
        preview: session.preview || "Click to view chat"
      }));

      setChatHistory(formattedSessions);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      setError("Failed to load chat history. Please try again.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userId = localStorage.getItem("Email");
    if (!userId) {
      setError("User not authenticated. Please log in.");
      setShowLoginModal(true);
      return;
    }

    if (!isFirstMessageSent) {
      const welcomeMessage = { text: `Hi ${name}, I am Dr.Chat 😊`, sender: "bot" };
      setMessages(prevMessages => [...prevMessages, welcomeMessage]);
      setIsFirstMessageSent(true);
    }
    let messageText = inputValue;
    if (currentEmotion === "sad") {
      messageText = "I am feeling sad";
    }
    const userMessage = { text: inputValue, sender: "user" };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    console.log(messageText);
    console.log(currentEmotion);
    try {
      let currentTitle = currentSessionTitle;
      if (currentSessionTitle === "New Chat" && messages.length <= 1) {
        currentTitle = inputValue.length > 30 ? inputValue.substring(0, 30) + "..." : inputValue;
        setCurrentSessionTitle(currentTitle);
        localStorage.setItem("chatSessionTitle", currentTitle);
      }

      // Get fitness context from localStorage (set by Dashboard)
      const fitnessContext = localStorage.getItem('fitness_context') || '';

      const response = await axiosClient.post("/api/chat", {
        userId,
        message: messageText,
        sessionId,
        title: currentTitle,
        emotion: currentEmotion, // Include current emotion in the API request
        fitnessContext // Include fitness data for personalized health suggestions
      });

      const data = response.data;
      const botMessage = {
        text: data.response,
        sender: "bot",
        actions: data.actions || [] // Include action buttons from LLM
      };

      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, botMessage];
        localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
        return updatedMessages;
      });

    } catch (err) {
      setError("Failed to get response. Please try again.");
      console.error("Chat API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshChat = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem("chatSessionId", newSessionId);
    console.log(localStorage.getItem("chatSessionId"));
    setMessages([]);
    localStorage.setItem("chatMessages", JSON.stringify([]));

    setCurrentSessionTitle("New Chat");
    localStorage.setItem("chatSessionTitle", "New Chat");

    setIsFirstMessageSent(false);

    if (showChatHistory) {
      setShowChatHistory(false);
    }
  };

  // Clear chat - archives messages for chatbot memory but removes visible messages
  const handleClearChat = async () => {
    const userId = localStorage.getItem("Email");
    if (!userId || !sessionId) {
      console.error("Cannot clear chat: missing user or session");
      return;
    }

    try {
      await axiosClient.post("/api/chat/clear", {
        userId,
        sessionId
      });

      // Clear local messages but keep same session
      setMessages([]);
      localStorage.setItem("chatMessages", JSON.stringify([]));
      setIsFirstMessageSent(false);

      console.log("✅ Chat cleared (memory retained for chatbot)");
    } catch (error) {
      console.error("Error clearing chat:", error);
      setError("Failed to clear chat. Please try again.");
    }
  };

  const handleToggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
    if (!showChatHistory) {
      fetchChatSessions();
    }
  };

  const loadChat = async (selectedSessionId) => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem("Email");

      const response = await axiosClient.get(`/api/chat/${selectedSessionId}?userId=${encodeURIComponent(userId)}`);
      const chatData = response.data;

      setSessionId(selectedSessionId);
      localStorage.setItem("chatSessionId", selectedSessionId);
      const selectedChat = chatHistory.find(chat => chat.id === selectedSessionId);
      if (selectedChat) {
        setCurrentSessionTitle(selectedChat.title);
      }

      const formattedMessages = Array.isArray(chatData.messages)
        ? chatData.messages
        : chatData.map(msg => ({
          text: msg.content || msg.text,
          sender: msg.role === 'user' ? 'user' : 'bot'
        }));

      if (formattedMessages.length === 0) {
        setMessages([]);
        setIsFirstMessageSent(false);
      } else {
        setMessages(formattedMessages);
        setIsFirstMessageSent(true);
      }

      setShowChatHistory(false);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setError("Failed to load chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUserReport(false);
  };

  return (
    <div className={`h-full italic flex flex-col ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
      {showChatHistory && (
        <ChatHistory
          chatHistory={chatHistory}
          loadChat={loadChat}
          handleToggleChatHistory={handleToggleChatHistory}
          currentSessionId={sessionId}
          isDarkMode={isDarkMode}
          handleRefreshChat={handleRefreshChat}
        />
      )}

      <div className={`flex-1 flex flex-col h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
        <div className={`border-b p-3 flex justify-between items-center ${isDarkMode ? "border-gray-700 bg-gray-800 text-gray-200" : "border-blue-100 bg-blue-50 text-gray-800"}`}>
          <h2 className="font-medium flex-1 text-center">{currentSessionTitle || "New Chat"}</h2>

          {/* Camera Toggle Button */}
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`p-2 rounded-full transition-all duration-200 ${cameraActive
              ? 'bg-green-500 text-white hover:bg-green-600'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            title={cameraActive ? "Disable emotion camera" : "Enable emotion camera"}
          >
            {cameraActive ? <FiCamera size={18} /> : <FiCameraOff size={18} />}
          </button>
        </div>

        {/* Emotion Camera Component */}
        {cameraActive && (
          <div className={`p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <EmotionCamera
              isEnabled={cameraActive}
              onEmotionChange={handleEmotionChange}
              showPreview={true}
              frameRate={10}
            />
          </div>
        )}

        {userReport && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className={`p-6 rounded-lg shadow-lg max-w-3xl w-130 relative ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
              >
                ✖
              </button>
              <GoGraph />
              <Report info={reportData} func={setReportData} messages={messages} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            error={error}
            onEmotionChange={handleEmotionChange} // Pass the emotion handler to ChatMessages
          />
        </div>

        {/* Clear Chat Button + Chat Input */}
        <div className="relative">
          {messages.length > 0 && (
            <div className={`flex justify-center py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <button
                onClick={handleClearChat}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200 
                  ${isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-red-900 hover:text-red-300'
                    : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`}
                title="Clear chat (chatbot will still remember this conversation)"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          )}

          <ChatInput
            handleSendMessage={handleSendMessage}
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            currentEmotion={currentEmotion}
          />
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
