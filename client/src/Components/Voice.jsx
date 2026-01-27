import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { RiMic2Line } from "react-icons/ri";
import Sidebar from "./Sidebar";
import { ThemeContext } from "./ThemeContext";

export default function Voice() {
  const navigate = useNavigate();
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [error, setError] = useState(null);
  const [isClicked, setIsClicked] = useState(false);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [apiResponse, setApiResponse] = useState("");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleMicClick = () => {
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

  if (recognition) {
    recognition.onstart = () => {
      console.log("Listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Text:", text);
      console.log("Transcript:", transcript);
      handleSendMessage(transcript);
      setText(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const handleSendMessage = async (textar) => {
    console.log("Textar:", textar);
    try {
      const response = await fetch('https://apparent-wolf-obviously.ngrok-free.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textar
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.response);

      setApiResponse(data.response);
      setIsClicked(false);

      // Analyze sentiment from user input
      const userSentiment = analyzeSentiment(textar);
      console.log("Detected sentiment:", userSentiment);

      // Also analyze response sentiment for more appropriate delivery
      const responseSentiment = analyzeSentiment(data.response);

      // Use the response sentiment primarily, but consider user sentiment too
      // This creates more contextually appropriate speech
      let finalSentiment = responseSentiment;

      // In some cases, we may want to prioritize the user's emotion
      if (userSentiment === 'sad' || userSentiment === 'anxious') {
        // For emotional support, mirror the user's emotion with a calming effect
        finalSentiment = 'calm';
      }

      // Configure and play speech
      const speech = configureSpeech(data.response, finalSentiment);
      
      // Cancel any ongoing speech and start speaking
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);

    } catch (err) {
      setError("Failed to get response. Please try again.");
      console.error("Chat API Error:", err);
    }
  };
  // ✅ Function to detect sentiment from text
  const analyzeSentiment = (text) => {
    // Expanded Tamil emotion keywords
    const emotions = {
      happy: ["மகிழ்ச்சி", "நன்றி", "அருமை", "நல்லது", "சந்தோஷம்", "வாழ்த்துக்கள்", "கிள்ளி", "சிரிப்பு", "ஆனந்தம்", "பெருமிதம்"],
      sad: ["துக்கம்", "அவலம்", "வருத்தம்", "தவிப்பு", "நஷ்டம்", "துயரம்", "மடிப", "கண்ணீர்", "சோகம்", "உடைந்த"],
      angry: ["கோபம்", "எரிச்சல்", "சினம்", "வெறுப்பு", "தொந்தரவு", "பொறுமை இழப்பு", "ஆத்திரம்"],
      anxious: ["பயம்", "கவலை", "பதற்றம்", "திகில்", "அச்சம்", "பதட்டம்", "நெருக்கடி"],
      calm: ["அமைதி", "நிம்மதி", "நிதானம்", "சாந்தம்", "தியானம்", "ஓய்வு"],
      excited: ["உற்சாகம்", "பரவசம்", "உந்துதல்", "விருப்பம்", "ஆர்வம்"]
    };

    const textLower = text.toLowerCase();

    // Check each emotion category
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(word => textLower.includes(word))) {
        return emotion;
      }
    }

    // Check for question patterns
    if (textLower.includes("?") ||
        textLower.includes("என்ன") ||
        textLower.includes("எப்படி") ||
        textLower.includes("ஏன்") ||
        textLower.includes("எங்கே")) {
      return "curious";
    }

    // Default to neutral if no emotion is detected
    return "neutral";
  };

  // Enhanced speech synthesis configuration with emotion-based voice parameters
  const configureSpeech = (text, sentiment) => {
    // Create speech utterance
    const speech = new SpeechSynthesisUtterance(text);

    // Get available voices
    const voices = window.speechSynthesis.getVoices();

    const tamilVoice = voices.find(voice =>
      voice.lang.includes('ta') || voice.name.toLowerCase().includes('tamil') && voice.name.includes('Female')
    );

    if (tamilVoice) {
      speech.voice = tamilVoice;
      console.log("Using Tamil Voice:", tamilVoice.name);
    } else {
      console.warn("Tamil voice not found, using default voice.");
    }

    // Apply emotional voice parameters
    switch (sentiment) {
      case 'happy':
        speech.pitch = 1.2;     // Higher pitch for happiness
        speech.rate = 1.1;      // Slightly faster
        speech.volume = 1.0;    // Full volume
        break;
      case 'sad':
        speech.pitch = 0.8;     // Lower pitch for sadness
        speech.rate = 0.8;      // Slower speed
        speech.volume = 0.8;    // Slightly softer
        break;
      case 'angry':
        speech.pitch = 1.3;     // Higher pitch
        speech.rate = 1.3;      // Faster speech
        speech.volume = 1.0;    // Full volume
        break;
      case 'anxious':
        speech.pitch = 1.1;     // Slightly higher pitch
        speech.rate = 1.2;      // Faster speech
        speech.volume = 0.9;    // Slightly reduced volume
        break;
      case 'calm':
        speech.pitch = 0.9;     // Slightly lower pitch
        speech.rate = 0.9;      // Slightly slower
        speech.volume = 0.85;   // Softer voice
        break;
      case 'excited':
        speech.pitch = 1.3;     // Higher pitch
        speech.rate = 1.2;      // Faster speech
        speech.volume = 1.0;    // Full volume
        break;
      case 'curious':
        speech.pitch = 1.1;     // Slightly higher pitch
        speech.rate = 1.0;      // Normal speed
        speech.volume = 0.95;   // Normal volume
        break;
      default: // neutral
        speech.pitch = 1.0;     // Normal pitch
        speech.rate = 1.0;      // Normal speed
        speech.volume = 0.9;    // Normal volume
    }

    // Set language to Tamil
    speech.lang = 'ta-IN';

    return speech;
  };

  return (
    <div className={`min-h-screen italic ${isDarkMode ? "bg-gray-900" : "bg-white"} ${isDarkMode ? "text-white" : "text-gray-900"} flex`}>

      <aside className="w-64 h-screen flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-row">
        <div className="w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md flex items-center justify-center">
            <iframe
              src="https://my.spline.design/avatarcopy-6a59820ff247b7a3c68fd762797be041/"
              width={500}
              height={500}
              frameBorder={0}
              className="mx-auto"
              allowFullScreen
            />
          </div>
        </div>

        <div className="w-1/2 flex flex-col items-center justify-center p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {apiResponse && (
            <div className="mb-8 bg-blue-50 rounded-2xl p-6 w-full max-w-md relative mx-auto shadow-lg">
              <div className="absolute w-20 h-20 rounded-full bg-blue-50 -top-6 -left-2"></div>
              <div className="absolute w-24 h-24 rounded-full bg-blue-50 -top-8 left-12"></div>
              <div className="absolute w-20 h-20 rounded-full bg-blue-50 -top-6 left-32"></div>
              <div className="absolute w-16 h-16 rounded-full bg-blue-50 -top-4 right-12"></div>
              <div className="absolute w-12 h-12 rounded-full bg-blue-50 -top-2 right-2"></div>

              <p className="text-gray-800 text-center font-medium z-10 relative pt-4">
                {apiResponse}
              </p>
            </div>
          )}

          {!apiResponse && (
            <div className="mb-8 bg-blue-50 rounded-2xl p-6 w-full max-w-md relative mx-auto shadow-lg">
              <div className="absolute w-20 h-20 rounded-full bg-blue-50 -top-6 -left-2"></div>
              <div className="absolute w-24 h-24 rounded-full bg-blue-50 -top-8 left-12"></div>
              <div className="absolute w-20 h-20 rounded-full bg-blue-50 -top-6 left-32"></div>
              <div className="absolute w-16 h-16 rounded-full bg-blue-50 -top-4 right-12"></div>
              <div className="absolute w-12 h-12 rounded-full bg-blue-50 -top-2 right-2"></div>

              <p className="text-gray-500 text-center font-medium z-10 relative pt-4">
                Speak to start a conversation...
              </p>
            </div>
          )}

          <div className="mt-4">
            <div
              className={`flex items-center justify-center h-16 w-16 rounded-full cursor-pointer ${isClicked ? "bg-white text-blue-500" : "bg-blue-500 text-white"
                } shadow-lg mx-auto transition-all duration-200 hover:scale-110`}
              onClick={handleMicClick}
            >
              <RiMic2Line size={30} />
            </div>
            <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
              {isListening ? "Listening..." : "Click to speak"}
            </p>
          </div>
          {text && (
  <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-md">
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Spoken Text:</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
  </div>
)}
          <div>

          </div>


        </div>
      </div>
    </div>
  );
}