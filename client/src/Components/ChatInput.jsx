import React, { useState, useEffect, useContext } from "react";
import { Play } from "lucide-react";
import { MdMic } from "react-icons/md";
import { axiosClient } from "../axios";
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

  const { isDarkMode } = useContext(ThemeContext);

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
      const detectResponse = await axiosClient.post(`https://libretranslate.com/detect`, {
        q: text,
      });
      const detectedLanguage = detectResponse.data[0].language;
      console.log("Detected Language:", detectedLanguage);

      const translateResponse = await axiosClient.post(`https://libretranslate.com/translate`, {
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
    <div className={`border-t ${isDarkMode ? "bg-gray-900" : "bg-white"} px-4 pb-7 pt-2 italic`}>
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className={`mt-2 border rounded-lg shadow-sm ${isDarkMode ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-gray-100 text-black"}`}>
            <div className="px-4 pb-4">
              <input
                type="text"
                placeholder={`Ask Medi... (You seem ${emotion.toLowerCase()})`}
                className={`w-full p-2 outline-none bg-transparent ${isDarkMode ? "text-white placeholder-gray-400" : "text-black placeholder-gray-500"}`}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                value={inputValue}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                disabled={isLoading}
              />
            </div>
            <div className={`border-t flex justify-end p-2 space-x-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <button onClick={handleVoiceMessage} className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-100"}`}>
                <MdMic className={`w-5 h-5 ${isListening ? "text-red-500" : "text-gray-400"}`} />
              </button>
              <button
                onClick={() => handleSendMessage(inputValue)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-100"}`}
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