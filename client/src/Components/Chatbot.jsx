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
import { axiosClient, chatAxiosClient } from "../axios";
import LoginModal from "./LoginModal";
import ActionButton from "./ActionButton";
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
      setMessages(storedMessages);

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
      const response = await chatAxiosClient.get(`/api/sessions/${encodeURIComponent(userId)}`);
      
      // Check if response is successful (200 status)
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const sessions = response.data;

      const formattedSessions = Array.isArray(sessions) 
        ? sessions.map(session => ({
            id: session.id || session.sessionId,
            title: session.title || `Chat ${new Date(session.timestamp || session.createdAt).toLocaleDateString()}`,
            date: new Date(session.timestamp || session.createdAt).toLocaleDateString(),
            preview: session.preview || "Click to view chat"
          }))
        : [];

      setChatHistory(formattedSessions);
      // Clear any error that might have been set previously
      setError(null);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      // Only set error for actual failures, not empty sessions
      if (error.response && error.response.status !== 404) {
        // 404 is expected when user has no chat sessions
        setError("Failed to load chat history. Please try again.");
      } else if (!error.response) {
        // Network or other errors
        setError("Failed to load chat history. Please try again.");
      }
      // For 404 errors (no sessions), we don't set an error
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

      const response = await chatAxiosClient.post("/api/chat", {
        message: messageText,
        sessionId
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

  const handleToggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
    if (!showChatHistory) {
      fetchChatSessions();
    }
  };

  const loadChat = async (selectedSessionId) => {
    try {
      setIsLoading(true);
      setError(null); // Clear any existing error before loading
      const userId = localStorage.getItem("Email");

      const response = await chatAxiosClient.get(`/api/history/${selectedSessionId}`);
      const chatData = response.data;

      // Check if response is successful (200 status)
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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

      // Handle empty history as success case
      if (formattedMessages.length === 0) {
        setMessages([]);
        setIsFirstMessageSent(false);
        // Ensure no error is shown for empty history
        setError(null);
      } else {
        setMessages(formattedMessages);
        setIsFirstMessageSent(true);
      }

      setShowChatHistory(false);
      // Error state is already cleared at the start, so no need to clear it again on success
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Only set error for actual failures, not empty history
      if (error.response && error.response.status !== 404) {
        // 404 is expected for new sessions with no history
        setError("Failed to load chat. Please try again.");
      } else if (!error.response) {
        // Network or other errors
        setError("Failed to load chat. Please try again.");
      }
      // For 404 errors (new sessions), we don't set an error
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUserReport(false);
  };

  const handleClearChat = async () => {
    // Clear UI immediately
    setMessages([]);
    setIsFirstMessageSent(false);
    setError(null); // Clear any existing error
    localStorage.setItem("chatMessages", JSON.stringify([]));
    
    // Reset session title
    setCurrentSessionTitle("New Chat");
    localStorage.setItem("chatSessionTitle", "New Chat");
    
    try {
      const response = await fetch('http://localhost:5000/api/clear-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear chat');
      }
      
      // Backend cleared successfully - UI already cleared above
      console.log("Chat history cleared successfully");
      
    } catch (error) {
      // Log error but don't show UI error since UI is already cleared
      console.warn("Backend clear failed, but UI is cleared:", error);
    }
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
          <h2 className="font-medium w-full text-center">{currentSessionTitle || "New Chat"}</h2>
        </div>

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
        
        {/* Clear Chat Button - fixed position near bottom */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 p-3 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent">
            <div className="flex justify-center">
              <button 
                onClick={handleClearChat}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isDarkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                title="Clear Chat History"
              >
                Clear Chat History
              </button>
            </div>
          </div>
        )}

        <ChatInput
          handleSendMessage={handleSendMessage}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          currentEmotion={currentEmotion} // Pass the emotion to ChatInput
        />
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
