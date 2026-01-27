import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContext';
import { Moon, Sun, Mic, Send, MessageCircle, Gamepad2, Volume2, History } from "lucide-react";
import { Link } from 'react-scroll';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const HomePage = () => {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const developers = [
    {
      name: "Mohamed Arsath H",
      position: "Backend Engineer",
      feedback: "Passionate about building scalable and efficient backend systems.",
      linkedin: "https://www.linkedin.com/in/arsath02/",
    },
    {
      name: "Ragav R",
      position: "Database Administrator",
      feedback: "Ensuring data integrity and optimizing database performance.",
      linkedin: "https://www.linkedin.com/in/ragav-r/"
    },
    {
      name: "Mohammed Sameer B",
      position: "Frontend Engineer",
      feedback: "Crafting intuitive and visually engaging user interfaces.",
      linkedin: "https://www.linkedin.com/in/mohammed-sameer-b-ab751b255/"
    },
    {
      name: "Sherin Aamina I",
      position: "Marketing Specialist",
      feedback: "Strategizing and executing impactful marketing campaigns.",
      linkedin: "https://www.linkedin.com/in/sherin-aaminaa-443937259/"
    }
  ];

  const features = [
    {
      icon: MessageCircle,
      title: "Intelligent Conversation",
      description: "Powered by advanced LLM Qwen chat technology that understands context and provides meaningful responses."
    },
    {
      icon: Moon,
      title: "Customizable Themes",
      description: "Personalize your experience with different themes to match your mood and preferences."
    },
    {
      icon: Gamepad2,
      title: "Interactive Games",
      description: "Engage with therapeutic games designed to improve mental wellbeing and provide moments of joy."
    },
    {
      icon: Volume2,
      title: "Voice Assistance",
      description: "Interact with your assistant through voice commands for a more natural conversation experience."
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Speak directly to your chatbot when typing feels overwhelming or inconvenient."
    },
    {
      icon: History,
      title: "Self Learning",
      description: "The chatbot remembers your conversations and learns from them to provide better support over time."
    }
  ];

  const [message, setMessage] = useState(""); // Single message input state
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    const userMessage = { text: message, sender: "user" };
    setChatHistory(prevMessages => [...prevMessages, userMessage]);
    setMessage("");

    try {
      const response = await fetch("https://apparent-wolf-obviously.ngrok-free.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });
      console.log(String(response)+" rog");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { text: data.response, sender: "bot" };

      setChatHistory(prevMessages => {
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


  useEffect(() => {
    const latestBotMessage = chatHistory.findLast((msg) => msg.sender === 'bot')?.text || '';

    if (latestBotMessage && typingIndex === chatHistory.length) return;

    if (latestBotMessage) {
      setDisplayedMessage('');
      let index = 0;

      const interval = setInterval(() => {
        if (index < latestBotMessage.length) {
          setDisplayedMessage(latestBotMessage.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 50);

      setTypingIndex(chatHistory.length);
    }
  }, [chatHistory]);


  useEffect(() => {
    const greetingMessage = {
      text: "Hi there! I'm Dr. Chat. How are you feeling today?",
      sender: "bot"
    };
    setChatHistory([greetingMessage]);
  }, []);

  return (

    <div className="flex-1 custom-scrollbar italic">
      <div className={`min-h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>

        <header className='fixed top-0 left-0 w-full z-50'>
          <nav className={`border-gray-100 px-4 lg:px-6 py-2.5 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
            <div className='flex justify-between items-center mx-auto max-w-screen-xl'>
              <span className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-600"}`}>
                🅓r. 𝙲𝚑𝚊𝚝
              </span>

              <div className='hidden lg:flex items-center space-x-8'>
                <ul className='flex space-x-6 font-medium'>
                  <li><Link to="home" smooth={true} duration={500} offset={-50} className='hover:text-gray-500 cursor-pointer'>Home</Link></li>
                  <li><Link to="features" smooth={true} duration={500} offset={-50} className='hover:text-gray-500 cursor-pointer'>Features</Link></li>
                  <li><Link to="developers" smooth={true} duration={500} offset={-50} className='hover:text-gray-500 cursor-pointer'>Developers</Link></li>
                  <li><Link to="contact" smooth={true} duration={500} offset={-50} className='hover:text-gray-500 cursor-pointer'>Contact</Link></li>
                </ul>
              </div>

              <div className='flex items-center space-x-4'>
                <button onClick={toggleTheme} className='p-2 hover:bg-gray-400 rounded-lg transition-colors'>
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${isDarkMode ? "bg-white text-black hover:bg-gray-300" : "bg-gray-600 text-white hover:bg-gray-700"}`}>
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${isDarkMode ? "bg-white text-black hover:bg-gray-300" : "bg-gray-600 text-white hover:bg-gray-700"}`}>
                  Sign Up
                </button>
              </div>
            </div>
          </nav>
        </header>


        <section id="home" className="py-20 md:py-28">
          <div className="container px-4 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className={`text-3xl font-bold tracking-tighter px-6 sm:text-4xl md:text-5xl lg:text-6xl ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-700'
                  }`}>
                    Your Emotional Support Companion
                  </h1>
                  <p className={`max-w-[600px] ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  } px-6 md:text-xl`}>
                    Connect with Dr. Chat, an AI-powered mental health assistant that listens,
                    learns, and supports you on your journey.
                  </p>
                </div>
              </div>


              <div className={`mx-auto lg:mx-0 rounded-lg border ${
                isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'
              } p-4 shadow-lg lg:order-last`}>
                <div className="flex flex-col h-[400px] w-full max-w-md">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                    <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Chat Preview
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
                    {chatHistory.map((msg, index) => (
                      <div key={index} className={`flex justify-${msg.sender === 'user' ? 'end' : 'start'}`}>
                        <div className={`flex items-start gap-2 max-w-[80%]`}>
                          <span className="relative flex shrink-0 overflow-hidden rounded-full h-8 w-8 border border-gray-200 dark:border-gray-800">
                            <div className="h-full w-full rounded-full bg-gray-700 flex items-center justify-center text-white text-xs">
                              {msg.sender === 'user' ? 'U' : 'B'}
                            </div>
                          </span>
                          <div className={`rounded-lg px-3 py-2 ${
                            msg.sender === 'user'
                              ? isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-200 text-black'
                              : isDarkMode
                              ? 'bg-gray-800 text-gray-100'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">
                              {msg.sender === 'bot' && index === chatHistory.length - 1
                                ? displayedMessage
                                : msg.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`p-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        className={`flex h-10 w-full rounded-md border px-3 py-2 text-base bg-background ${
                          isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'
                        } focus:outline-none focus:ring-0`}
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button
                        className={`h-10 w-10 flex items-center justify-center rounded-md ${
                          isDarkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-800'
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                        } focus:outline-none focus:ring-0`}
                        onClick={handleSendMessage}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                  {isLoading && <p className="text-gray-500 text-sm mt-2">Loading...</p>}
                </div>
              </div>
            </div>
          </div>
        </section>


        <section id="features" className={`py-12 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          <div className='container px-4 md:px-6 mx-auto'>
            <div className='flex flex-col items-center justify-center space-y-4 text-center'>
              <div className='space-y-2'>
                <h2 className={`text-3xl font-bold tracking-tighter md:text-4xl ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                  Features Designed for You
                </h2>
                <p className={`max-w-[700px] ${isDarkMode ? "text-gray-400":"text-gray-700"} md:text-xl`}>
                  Our chatbot combines advanced AI with thoughtful features to provide personalized support.
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center text-center p-6 rounded-lg border ${
                    isDarkMode ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"
                  } shadow-sm transition-all hover:shadow-md`}
                >
                  <div className={`mb-4 rounded-full p-3 ${
                    isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}>
                    <feature.icon className='w-7 h-7' />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developers Section */}
        <section id="developers" className={`py-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <div className="container px-4 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <h2 className={`text-3xl font-bold tracking-tighter md:text-4xl ${
                isDarkMode ? "text-gray-100" : "text-gray-800"
              }`}>
                Developers
              </h2>
              <p className={`max-w-[700px] md:text-lg ${
                isDarkMode ? "text-gray-400" : "text-gray-700"
              }`}>
                Meet the team behind the innovation, dedicated to building seamless experiences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 place-items-center">
              {developers.map((dev, index) => (
                <div
                  key={index}
                  className={`w-full max-w-sm flex flex-col items-center text-center p-6 rounded-lg border ${
                    isDarkMode ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"
                  } shadow-sm transition-all hover:shadow-md`}
                >
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xl font-bold mb-2 ${
                      isDarkMode ? "text-gray-100 hover:text-gray-300" : "text-gray-900 hover:text-gray-700"
                    }`}
                  >
                    {dev.name}
                  </a>
                  <h4 className={`text-md font-medium mb-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {dev.position}
                  </h4>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    {dev.feedback}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


      
     {/* <section id="developers" className={`py-12 px-4 sm:px-6 lg:px-12 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
              Developers
            </h2>
            <p className={`max-w-[700px] text-sm sm:text-base md:text-lg ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
              Meet the team behind the innovation, dedicated to building seamless experiences.
            </p>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-1 mt-4 sm:gap-2 place-items-center -mt-2">
            {developers.map((testimonial, index) => (
              <div
                key={index}
                className={`w-full max-w-[400px] flex flex-col items-center text-center p-3 sm:p-4 rounded-lg border ${
                  isDarkMode ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-white"
                } shadow-sm transition-all hover:shadow-md`}
              >
                <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {testimonial.name}
                </h3>
                <h4 className={`text-sm sm:text-md font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {testimonial.position}
                </h4>
                <p className={`text-sm sm:text-base ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{testimonial.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section id="contact" className={`py-10 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center md:items-start">
          {/* Left Side - Branding */}
          <div className="text-center md:text-left mb-6 md:mb-0 px-8">
            <h2 className="text-2xl font-bold">🅓r. 𝙲𝚑𝚊𝚝</h2>
            <p className="text-gray-400">Your companion for emotional support and mental wellbeing.</p>
            <p className="text-gray-400">
              Mail us at <a href="mailto:drchat@gmail.com" className={` ${isDarkMode ? "text-gray-200" : "text-gray-600"} hover:underline`}>drchat@gmail.com</a>
            </p>
          </div>
          {/* Right Side - Links */}
          <div className="flex flex-row space-x-12">
            <div>
              <h3 className="text-lg font-semibold">Links</h3>
              <ul className="text-gray-400 space-y-1">
                <li><a href="">LinkedIn</a></li>
                <li><a href="">Github</a></li>
              </ul>
            </div>

          </div>
        </div>
        {/* Footer */}
        <div className="text-center text-gray-500 mt-8 text-sm">
          © 2025 Dr. Chat. All rights reserved.
        </div>
      </section>
    </div>
    </div>
  );
};

export default HomePage;