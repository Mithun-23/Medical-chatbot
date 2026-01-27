import React, { useEffect, useRef, useState, useContext } from "react";
import { ThemeContext } from "./ThemeContext";

const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsDone(false);

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, index));
      index++;
      if (index > text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}{!isDone && "█"}</span>;
};

const UserAvatar = ({ initial }) => (
  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
    {initial}
  </div>
);

const BotAvatar = ({ isDarkMode, emotion }) => {
  // Use emotional state to modify bot avatar
  const getEmotionColor = () => {
    switch(emotion) {
      case 'Happy':
        return 'from-yellow-400 to-orange-500';
      case 'Sad':
        return 'from-blue-400 to-blue-600';
      case 'Angry':
        return 'from-red-500 to-red-700';
      case 'Surprise':
        return 'from-purple-400 to-purple-600';
      case 'Fear':
        return 'from-green-400 to-green-600';
      case 'Disgusted':
        return 'from-amber-500 to-amber-700';
      default:
        return 'from-pink-500 to-purple-600';
    }
  };

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md bg-gradient-to-br ${getEmotionColor()} text-white`}>
      B
    </div>
  );
};

const EmotionBadge = ({ emotion }) => {
  const getEmotionColor = () => {
    switch(emotion) {
      case 'Happy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Sad':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Angry':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Surprise':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Fear':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Disgusted':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEmotionColor()} ml-2`}>
      {emotion}
    </span>
  );
};

const MessageBubble = ({ message, userInitial, isDarkMode, isLatestBotMessage, shouldShowTypingEffect, emotion }) => {
  const [showTypingEffect, setShowTypingEffect] = useState(isLatestBotMessage && message.sender === "bot");

  if (!message || !message.sender || !message.text) return null;

  return (
    <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}>
      {message.sender === "bot" && <BotAvatar isDarkMode={isDarkMode} emotion={emotion} />}

      <div
        className={`max-w-[80%] rounded-lg p-3 mx-2 ${message.sender === "user"
            ? "bg-gray-600 text-white"
            : isDarkMode
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-900"
          }`}
      >
        <p className="text-sm whitespace-pre-wrap">
          {message.sender === "bot" && shouldShowTypingEffect ? (
            <TypingEffect text={message.text} />
          ) : (
            message.text
          )}
          {message.sender === "bot" && <EmotionBadge emotion={emotion} />}
        </p>
      </div>

      {message.sender === "user" && <UserAvatar initial={userInitial} />}
    </div>
  );
};

export default function ChatMessages({ messages, isLoading, error, onEmotionChange }) {
  const messagesEndRef = useRef(null);
  const [userInitial, setUserInitial] = useState("U");
  const { isDarkMode } = useContext(ThemeContext);
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [emotion, setEmotion] = useState('Neutral');
  const prevMessagesRef = useRef([]);
  const isInitialLoadRef = useRef(true);
  const name = localStorage.getItem("Name") || "User";
  const emotionIntervalRef = useRef(null);

  useEffect(() => {
    const storedName = localStorage.getItem("Name");
    const storedEmail = localStorage.getItem("Email");

    if (storedName && storedName.length > 0) {
      setUserInitial(storedName.charAt(0).toUpperCase());
    } else if (storedEmail && storedEmail.length > 0) {
      setUserInitial(storedEmail.charAt(0).toUpperCase());
    }
  }, []);

  useEffect(() => {
    // Set up emotion fetching
    emotionIntervalRef.current = setInterval(() => {
      fetch('https://apparent-wolf-obviously.ngrok-free.app/emotion')
        .then(response => response.json())
        .then(data => {
          setEmotion(data.emotion);
          // Pass the emotion up to the parent component
          if (onEmotionChange) {
            onEmotionChange(data.emotion);
          }
        })
        .catch(err => console.error('Error fetching emotion:', err));
    }, 1000);

    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
    };
  }, [onEmotionChange]);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevMessagesRef.current = [...messages];
      return;
    }

    if (messages.length > prevMessagesRef.current.length) {
      const lastMessageIndex = messages.length - 1;
      const lastMessage = messages[lastMessageIndex];

      if (lastMessage.sender === "bot") {
        setShowTypingEffect(true);
        setTypingMessageIndex(lastMessageIndex);

        const timer = setTimeout(() => {
          setShowTypingEffect(false);
        }, lastMessage.text.length * 20 + 100);

        return () => clearTimeout(timer);
      }
    }

    prevMessagesRef.current = [...messages];
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar italic">
      <div className="flex-1/2 p">
        <div style={{
          position: 'fixed',
          top: '55px',
          right: '10px',
          width: '300px',
          height: '200px',
          zIndex: '1000',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '10px'
        }}>
          <img
            src="https://apparent-wolf-obviously.ngrok-free.app/video_feed"
            alt="Video Feed"
            style={{ width: '100%', height: '100%', borderRadius: '8px' }}
          />
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '15px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {emotion}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 p-4">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isDarkMode={isDarkMode}
              userInitial={userInitial}
              shouldShowTypingEffect={showTypingEffect && index === typingMessageIndex}
              emotion={emotion}
            />
          ))
        ) : (
          <div className="flex justify-start mb-4">
            <BotAvatar isDarkMode={isDarkMode} emotion={emotion} />
            <div
              className={`max-w-[80%] rounded-lg p-3 mx-2 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                <TypingEffect text={`Hi ${name}, I am Dr.Chat 😊`} />
                <EmotionBadge emotion={emotion} />
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <BotAvatar isDarkMode={isDarkMode} emotion={emotion} />
            <div className={`rounded-lg p-3 shadow-md ml-2 ${isDarkMode ? "bg-gray-800" : "bg-white"
              }`}>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
              {error}
              <button
                className="ml-2 underline"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}