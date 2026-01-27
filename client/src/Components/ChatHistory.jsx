import React from "react";
import { X, Trash2, Calendar } from "lucide-react";
import { RepeatIcon as ArrowRepeat } from "lucide-react";
import { FaPlus } from "react-icons/fa";
export default function ChatHistory({ chatHistory, loadChat, handleToggleChatHistory, isDarkMode, currentSessionId ,handleRefreshChat}) {
  const deleteChat = async (sessionId, e) => {
    e.stopPropagation(); 

    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        const userId = localStorage.getItem("Email");
        const response = await fetch(`https://medical-chatbot-02.onrender.com/api/chat/${sessionId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete chat");
        }

        window.location.reload(); // Refresh chat history
      } catch (error) {
        console.error("Error deleting chat:", error);
        alert("Failed to delete chat. Please try again.");
      }
    }
  };


  return (
    <div
      className={`w-64 border-r flex italic flex-col h-screen absolute left-16 z-10
      ${isDarkMode ? "bg-gray-900 text-gray-200 border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
    >

      <div className={`p-3 border-b flex items-center justify-between
        ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
        <h2 className="font-medium">Recent Chats</h2>
        <div className="pl-15">
        <button
          onClick={handleToggleChatHistory}
          className={` rounded-full transition-colors duration-300
          ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
           <FaPlus size={12} color="gray" onClick={handleRefreshChat}/>
        </button>
        </div>
        <button
          onClick={handleToggleChatHistory}
          className={`p-1 rounded-full transition-colors duration-300
          ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>


      <div className="flex-1 overflow-y-auto">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`p-3 border-b cursor-pointer truncate relative transition-colors duration-300
                ${isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"}
                ${currentSessionId === chat.id ? "bg-blue-900/20 text-blue-300 dark:bg-blue-700/40" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-medium text-sm truncate transition-colors duration-300
                  ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
                  {chat.title}
                </h3>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className={`p-1 rounded-full absolute right-2 top-2 transition-colors duration-300
                  ${isDarkMode ? "hover:bg-red-900/40" : "hover:bg-red-100"}`}
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
                </button>
              </div>
              <div className={`flex items-center mt-1 text-xs transition-colors duration-300
                ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                <Calendar className="w-3 h-3 mr-1" />
                <span>{chat.date}</span>
              </div>
              <p className={`text-xs truncate mt-1 transition-colors duration-300
                ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {chat.preview || "Click to load this chat"}
              </p>
            </div>
          ))
        ) : (
          <div className={`p-4 text-center transition-colors duration-300
            ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            <p>No chat history found</p>
            <p className="text-xs mt-2">Start a new conversation to see it here</p>
          </div>
        )}
      </div>
    </div>
    );
}
