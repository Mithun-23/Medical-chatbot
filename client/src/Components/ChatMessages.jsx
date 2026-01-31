import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import ActionButton from "./ActionButton";

// Parse markdown-style links [text](url) and raw URLs from message
const parseMessageWithLinks = (text) => {
  if (!text) return [];

  // Regex for markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Regex for raw URLs (http/https) not already part of a markdown link
  // This is a simplified regex; production usage might need a more complex one
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  // First pass: Find markdown links
  // We need to handle this carefully if we want to support both. 
  // A simple approach is to split by markdown links first.

  const segments = [];
  let currentText = text;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'link', text: match[1], url: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // Second pass: Find raw URLs in text segments
  const finalParts = [];
  segments.forEach(segment => {
    if (segment.type === 'link') {
      finalParts.push(segment);
    } else {
      // Check for raw URLs in this text segment
      let subLastIndex = 0;
      let subMatch;
      const subText = segment.content;

      while ((subMatch = urlRegex.exec(subText)) !== null) {
        if (subMatch.index > subLastIndex) {
          finalParts.push({ type: 'text', content: subText.slice(subLastIndex, subMatch.index) });
        }
        finalParts.push({ type: 'link', text: subMatch[1], url: subMatch[1] });
        subLastIndex = subMatch.index + subMatch[0].length;
      }
      if (subLastIndex < subText.length) {
        finalParts.push({ type: 'text', content: subText.slice(subLastIndex) });
      }
    }
  });

  return finalParts.length > 0 ? finalParts : [{ type: 'text', content: text }];
};

// Component to render text with clickable links
const LinkifiedText = ({ text, isDarkMode }) => {
  const navigate = useNavigate();
  const parts = parseMessageWithLinks(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          const isInternalLink = part.url.startsWith('/');
          return (
            <a
              key={index}
              href={part.url}
              onClick={(e) => {
                if (isInternalLink) {
                  e.preventDefault();
                  navigate(part.url);
                }
              }}
              target={isInternalLink ? undefined : "_blank"}
              rel={isInternalLink ? undefined : "noopener noreferrer"}
              className={`font-semibold underline transition-colors ${isDarkMode
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'
                }`}
            >
              {part.text}
            </a>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
};

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
  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
    {initial}
  </div>
);

const BotAvatar = ({ isDarkMode, emotion }) => {
  // Use emotional state to modify bot avatar
  const getEmotionColor = () => {
    switch (emotion) {
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
    switch (emotion) {
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
    <div className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"} mb-4`}>
      <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} w-full`}>
        {message.sender === "bot" && <BotAvatar isDarkMode={isDarkMode} emotion={emotion} />}

        <div
          className={`max-w-[80%] rounded-lg p-3 mx-2 ${message.sender === "user"
            ? "bg-blue-600 text-white"
            : isDarkMode
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-900"
            }`}
        >
          <p className="text-sm whitespace-pre-wrap">
            {message.sender === "bot" && shouldShowTypingEffect ? (
              <TypingEffect text={message.text} />
            ) : message.sender === "bot" ? (
              <LinkifiedText text={message.text} isDarkMode={isDarkMode} />
            ) : (
              message.text
            )}
            {message.sender === "bot" && <EmotionBadge emotion={emotion} />}
          </p>
        </div>

        {message.sender === "user" && <UserAvatar initial={userInitial} />}
      </div>

      {/* Render action buttons for bot messages */}
      {message.sender === "bot" && message.actions && message.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 ml-14">
          {message.actions.map((action, actionIndex) => (
            <ActionButton key={actionIndex} action={action} />
          ))}
        </div>
      )}
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
    // emotionIntervalRef.current = setInterval(() => {
    //   fetch('https://apparent-wolf-obviously.ngrok-free.app/emotion')
    //     .then(response => response.json())
    //     .then(data => {
    //       setEmotion(data.emotion);
    //       // Pass the emotion up to the parent component
    //       if (onEmotionChange) {
    //         onEmotionChange(data.emotion);
    //       }
    //     })
    //     .catch(err => console.error('Error fetching emotion:', err));
    // }, 1000);

    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
    };
  }, [onEmotionChange]);

  useEffect(() => {
    // Skip animation on initial load - only animate truly new messages
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevMessagesRef.current = [...messages];
      // Mark that we've seen all current messages, so don't animate them
      return;
    }

    // Only animate if we have MORE messages than before (new message added)
    if (messages.length > prevMessagesRef.current.length) {
      const lastMessageIndex = messages.length - 1;
      const lastMessage = messages[lastMessageIndex];

      // Only animate bot messages that are genuinely new (not loaded from storage)
      if (lastMessage.sender === "bot" && !lastMessage._loaded) {
        setShowTypingEffect(true);
        setTypingMessageIndex(lastMessageIndex);

        const timer = setTimeout(() => {
          setShowTypingEffect(false);
        }, Math.min(lastMessage.text.length * 20 + 100, 3000)); // Cap at 3s

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
              className={`max-w-[80%] rounded-lg p-3 mx-2 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"}`}
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
            <div className={`rounded-lg p-3 shadow-md ml-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className={`rounded-lg p-3 text-sm ${isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
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