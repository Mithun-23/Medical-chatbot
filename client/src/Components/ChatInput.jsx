import React, { useState, useEffect, useContext } from "react";
import { Play } from "lucide-react";
import { MdMic } from "react-icons/md";
import axios from "axios";
import { ThemeContext } from "./ThemeContext";
import io from 'socket.io-client';

export default function ChatInput({
  handleSendMessage,
  inputValue,
  setInputValue,
  isLoading,
  currentEmotion // Add the currentEmotion prop from parent
}) {
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [emotion, setEmotion] = useState(currentEmotion || "Neutral"); // Initialize with prop or default
  const [message, setMessage] = useState("");

  const {isDarkMode} = useContext(ThemeContext);
  const socket = io('https://apparent-wolf-obviously.ngrok-free.app');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  // Update local emotion state when the prop changes
  useEffect(() => {
    if (currentEmotion) {
      setEmotion(currentEmotion);
    }
  }, [currentEmotion]);

  const handleTyping = (e) => {
    setInputValue(e.target.value);
    setIsTyping(true);
  };

  useEffect(() => {
    if (inputValue === "") {
      setIsTyping(false);
    }
  }, [inputValue]);

  const handleVoiceMessage = () => {
    console.log("clicked");
    setIsClicked(!isClicked);
    if (recognition) {
      if (!isListening) {
        recognition.start();
        setIsListening(true);
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const detectAndTranslateText = async (text) => {
    try {
      const detectResponse = await axios.post(`https://libretranslate.com/detect`, {
        q: text,
      });
      const detectedLanguage = detectResponse.data[0].language;
      console.log("Detected Language:", detectedLanguage);

      const translateResponse = await axios.post(`https://libretranslate.com/translate`, {
        q: text,
        source: detectedLanguage,
        target: targetLanguage,
      });
      return translateResponse.data.translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  if (recognition) {
    recognition.onstart = () => {
      console.log("Listening...");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);
      const translatedText = await detectAndTranslateText(transcript);
      console.log("Translated Text:", translatedText);
      setInputValue(translatedText);
      handleSendMessage(translatedText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  return (
    <div className={`border-t ${isDarkMode ? "bg-gray-900": "bg-white"} px-4 pb-7 pt-2 italic`}>
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className={`absolute left-8 transition-all duration-500 ease-bounce ${
            isTyping || inputValue ? "-top-28" : "-top-14"
          }`}>
            <div className="relative w-20 h-20 ml-150">
              <div className="absolute inset-0 scale-150 bg-gradient-radial from-yellow-200/50 to-transparent dark:from-yellow-900/30 rounded-full blur-xl"></div>
              <div className="absolute inset-0 scale-125 bg-gradient-radial from-white to-transparent dark:from-white/10 rounded-full blur-md"></div>
              <div className="relative w-20 h-20 bg-white dark:bg-gray-200 rounded-full shadow-lg flex items-center justify-center">
                {/* Eyes change based on emotion */}
                <div className={`absolute top-7 left-4 w-3 h-3 ${
                  emotion === "Sad" ? "h-2 rounded-b-full" :
                  emotion === "Angry" ? "transform rotate-45" :
                  "rounded-full"
                } bg-red-900`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                </div>
                <div className={`absolute top-7 right-4 w-3 h-3 ${
                  emotion === "Sad" ? "h-2 rounded-b-full" :
                  emotion === "Angry" ? "transform rotate-45" :
                  "rounded-full"
                } bg-red-900`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                </div>
                {/* Mouth changes based on emotion */}
                <div className="absolute top-11 left-1/2 -translate-x-1/2 w-6 h-3">
                  <svg viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d={emotion === "Happy" ? "M4 8C4 8 8 2 12 2C16 2 20 8 20 8" :
                         emotion === "Sad" ? "M4 2C4 2 8 8 12 8C16 8 20 2 20 2" :
                         emotion === "Angry" ? "M2 7L10 7L14 7L22 7" :
                         emotion === "Surprise" ? "M8 6C8 6 12 10 16 6" :
                         "M4 2C4 2 8 8 12 8C16 8 20 2 20 2"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className={emotion === "Happy" ? "text-green-400" :
                               emotion === "Angry" ? "text-red-500" :
                               emotion === "Sad" ? "text-blue-400" :
                               "text-pink-400"}
                    />
                  </svg>
                </div>
                <div className="absolute -top-6 left-3 w-5 h-10 bg-pink-200 dark:bg-pink-300 rounded-full transform -rotate-12"></div>
                <div className="absolute -top-6 right-3 w-5 h-10 bg-pink-200 dark:bg-pink-300 rounded-full transform rotate-12"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className={`mt-2 border dark:border-gray-900 rounded-lg shadow-sm ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}>
            <div className="px-4 pb-4">
              <input
                type="text"
                placeholder={`Ask Medi... (You seem ${emotion.toLowerCase()})`}
                className={`w-full p-2 outline-none bg-transparent ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                value={inputValue}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                disabled={isLoading}
              />
            </div>
            <div className="border-t dark:border-gray-700 flex justify-end p-2 space-x-2">
              <button onClick={handleVoiceMessage} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MdMic className={`w-5 h-5 ${isListening ? "text-red-500" : "text-gray-400"}`} />
              </button>
              <button
                onClick={() => handleSendMessage(inputValue)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={!inputValue.trim() || isLoading}
              >
                <Play className={`w-5 h-5 ${!inputValue.trim() || isLoading ? "text-gray-400" : "text-blue-500"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}