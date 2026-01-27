import React, { useState, useEffect } from "react";
import { RepeatIcon as ArrowRepeat, Newspaper, Music, Moon, Sun } from "lucide-react";
import { IoAccessibilitySharp } from "react-icons/io5";
import { SiChatbot } from "react-icons/si";
import { GiEntryDoor } from "react-icons/gi";
import {useNavigate} from "react-router-dom";
import { MdHealthAndSafety } from "react-icons/md";
import { MdVideoCameraFront } from "react-icons/md";

import { IoLogoGameControllerB } from "react-icons/io";

import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";


export default function Sidebar({ handleRefreshChat, handleToggleChatHistory, handleShareChat, handleLogin, showChatHistory, handleVoice }) {
  const {isDarkMode, setIsDarkMode} = useContext(ThemeContext);
  const [userInitial, setUserInitial] = useState(null);
  const [showIframe, setShowIframe] = useState(false);

  const ToogleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const navigate=useNavigate();
  useEffect(() => {

    const storedEmail = localStorage.getItem("Email");
    if (storedEmail && storedEmail.length > 0) {
      setUserInitial(storedEmail.charAt(0).toUpperCase());
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("Email");


    setUserInitial(null);


    window.location.href = "/login";
  };
  const handlechatbot=()=>{
    navigate("/chatbot");
  }
  const handlehealth=()=>{
    navigate("/FitbitLogin");
  }
  const handlegame=()=>{
    navigate("/game-selector");
  }
  const goToProfile = () => {
    navigate("/profile"); // Use this if using React Router
  };


  const handleMusic = () => {
    setShowIframe(true);  // This sets the state to show the iframe
  };
const handleCamera=()=>{
  navigate("/camera");
}

  return (
    <div
      className={`fixed italic w-16 backdrop-blur-sm border-r flex flex-col items-center py-6 space-y-7 z-20
        ${isDarkMode ? "bg-gray-900 text-white border-gray-800" : "bg-white text-gray-800 border-gray-100"}`}
    >
    <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
        <div className="ml-1">
          <MdVideoCameraFront size={20} color="gray" onClick={handleCamera} />
          </div>
          </div>
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold
        ${isDarkMode ? "bg-white text-black" : "bg-gray-900 text-white"}`}
    >
      Dr
    </div>


      {/* <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ">
      <div className="ml-1">
          <ArrowRepeat size={20} color="gray" onClick={handleRefreshChat}/>
          </div>
          </div> */}
        <div title="Chat History" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <div className="ml-1">
            <Newspaper size={20} color="gray" onClick={handleToggleChatHistory} />
          </div>
        </div>
        <div title="Music" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="ml-1">
          <Music color="gray" size={20} onClick={handleMusic}/>

          </div>
          </div>
          {/* Display the iframe if showIframe is true */}
      {showIframe && (
        navigate("/music")
      )}

      <div title="Voice Assistant" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="ml-1">
          <IoAccessibilitySharp color="gray" size={20} onClick={handleVoice} />
        </div>
      </div>
      <div title="chat" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="ml-1">
          <SiChatbot color="gray" size={20} onClick={handlechatbot} />
        </div>
      </div>
      <div title="Health Track" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="ml-1">
          <MdHealthAndSafety color="gray" size={20} onClick={handlehealth} />
        </div>
      </div>

      <button
        title="Theme"
        onClick={ToogleTheme}
        className="p-2 hover-bg rounded-lg transition-colors"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 icon" />
        ) : (
          <Moon className="w-5 h-5 icon" />
        )}
      </button>

      {/* Show logout door icon if user is logged in */}
      <div title="Games" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="ml-1">
          <IoLogoGameControllerB color="gray" size={20} onClick={handlegame} />
        </div>
      </div>

      {userInitial ? (
        <button
          onClick={goToProfile} // Function to navigate to the profile page
          title="Profile"
          className={`mt-auto w-10 h-10 rounded-full flex items-center justify-center font-bold
            ${isDarkMode ? "bg-white text-gray-900" : "bg-gray-900 text-white"} transition-all hover:opacity-80`}
        >
          {userInitial}
        </button>
      ) : (
        <button
          className={`mt-auto p-2 rounded-lg text-sm transition-all
            ${isDarkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          onClick={handleLogin}
        >
          Login
        </button>
      )}

      {userInitial && (
        <div title="Logout" className="p-2 mt-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer" onClick={handleLogout}>
          <div className="ml-2 flex items-center">
            <GiEntryDoor color="gray" size={25} />
          </div>
        </div>
      )}
    </div>
  );
}