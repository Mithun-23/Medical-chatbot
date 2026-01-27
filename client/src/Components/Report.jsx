"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ReportCard({
  info = {
    messageCount: 0,
    sentiment: "Unknown",
    summary: "No summary available",
    updatedAt: "",
    message: "No additional information available.",
  },
  messages = [], // New prop to handle multiple messages
}) {
  const [showMessage, setShowMessage] = useState(false);
  const [userData, setUserData] = useState({ userId: "N/A", sessionId: "N/A" });
  console.log("Messages received:", messages);

  useEffect(() => {
    const userId = localStorage.getItem("Email") || "N/A";
    const sessionId = localStorage.getItem("chatSessionId") || "N/A";
    setUserData({ userId, sessionId });

    console.log("User ID:", userId);
    console.log("Session ID:", sessionId);
  }, []);

  const handleCardClick = () => setShowMessage(!showMessage);

  const formattedDate = info?.updatedAt
    ? formatDistanceToNow(new Date(info.updatedAt), { addSuffix: true })
    : "Unknown";

  const getSentimentColor = (sentiment = "") => {
    const sentimentLower = sentiment.toLowerCase();
    if (sentimentLower.includes("positive")) return "bg-green-200 text-green-800";
    if (sentimentLower.includes("negative")) return "bg-red-200 text-red-800";
    if (sentimentLower.includes("neutral")) return "bg-blue-200 text-blue-800";
    return "bg-gray-200 text-gray-800";
  };

  return (
    <div
      className="w-full max-w-md rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow text-black cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
          <User className="h-5 w-5" />
          User Report
        </h3>
      </div>

      <div className="p-6 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-medium">{userData.userId || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Session ID</p>
            <p className="font-medium truncate" title={userData.sessionId}>
              {userData.sessionId || "N/A"}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Sentiment</p>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                  info?.sentiment
                )}`}
              >
                {info?.sentiment || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Summary</p>
          <p className="text-sm">{info?.summary || "No summary available"}</p>
        </div>

        <div className="pt-2 flex items-center text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>Updated {formattedDate}</span>
        </div>

        {showMessage && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-400">
            <p className="font-semibold">User Messages:</p>
            {messages.length > 0 ? (
              <ul className="list-disc pl-4">
                {messages.map((msg, index) => (
                  <li key={index} className="text-sm">{msg}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No additional messages available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
