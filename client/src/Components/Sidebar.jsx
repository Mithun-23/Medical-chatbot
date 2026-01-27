import React, { useState, useEffect, useContext } from "react";
import {
  Newspaper,
  Music,
  Moon,
  Sun,
} from "lucide-react";
import { IoAccessibilitySharp } from "react-icons/io5";
import { SiChatbot } from "react-icons/si";
import { GiEntryDoor } from "react-icons/gi";
import { useNavigate, useLocation } from "react-router-dom";
import { MdHealthAndSafety } from "react-icons/md";
import { IoLogoGameControllerB } from "react-icons/io";
import { ThemeContext } from "./ThemeContext";
import LoginModal from "./LoginModal";
import { getAuth, signOut } from "firebase/auth";

export default function Sidebar() {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const [userInitial, setUserInitial] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedEmail = localStorage.getItem("Email");
    if (storedEmail && storedEmail.length > 0) {
      setUserInitial(storedEmail.charAt(0).toUpperCase());
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      // Clear all auth-related localStorage
      localStorage.removeItem("Email");
      localStorage.removeItem("Name");
      localStorage.removeItem("userId");
      setUserInitial(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    const storedEmail = localStorage.getItem("Email");
    if (storedEmail && storedEmail.length > 0) {
      setUserInitial(storedEmail.charAt(0).toUpperCase());
    }
  };

  // Check if a path is active
  const isActive = (path) => location.pathname === path;

  // Get nav item classes with active state
  const getNavItemClass = (path) => {
    const baseClass = "p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center";
    if (isActive(path)) {
      return `${baseClass} ${isDarkMode ? "bg-gray-600 shadow-lg" : "bg-blue-500 shadow-lg"}`;
    }
    return `${baseClass} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-100"}`;
  };

  // Get icon color based on active state
  const getIconColor = (path) => isActive(path) ? "white" : "gray";

  // Common hover class for bottom buttons
  const bottomButtonClass = `p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-blue-100"}`;

  return (
    <div
      className={`fixed h-screen w-16 backdrop-blur-sm border-r flex flex-col items-center py-6 gap-4 z-20
        ${isDarkMode ? "bg-gray-900 text-white border-gray-800" : "bg-white text-gray-800 border-gray-100"}`}
    >
      {/* Logo */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold mb-2
        ${isDarkMode ? "bg-gray-600 text-white" : "bg-blue-600 text-white"}`}
      >
        Dr
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-2">
        {/* Chat History */}
        <div
          title="Chat"
          className={getNavItemClass("/chatbot")}
          onClick={() => navigate("/chatbot")}
        >
          <Newspaper size={20} color={getIconColor("/chatbot")} />
        </div>

        {/* Music */}
        <div
          title="Music"
          className={getNavItemClass("/music")}
          onClick={() => navigate("/music")}
        >
          <Music size={20} color={getIconColor("/music")} />
        </div>

        {/* Voice Assistant */}
        <div
          title="Voice Assistant"
          className={getNavItemClass("/voice")}
          onClick={() => navigate("/voice")}
        >
          <IoAccessibilitySharp size={20} color={getIconColor("/voice")} />
        </div>

        {/* Health Track */}
        <div
          title="Health Track"
          className={getNavItemClass("/FitbitLogin")}
          onClick={() => navigate("/FitbitLogin")}
        >
          <MdHealthAndSafety size={20} color={getIconColor("/FitbitLogin")} />
        </div>

        {/* Games */}
        <div
          title="Games"
          className={getNavItemClass("/game-selector")}
          onClick={() => navigate("/game-selector")}
        >
          <IoLogoGameControllerB size={20} color={getIconColor("/game-selector")} />
        </div>
      </nav>

      {/* Spacer to push bottom items down */}
      <div className="flex-grow" />

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-3">
        {/* Profile / Login Button */}
        {userInitial ? (
          <button
            onClick={() => navigate("/profile")}
            title="Profile"
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all hover:opacity-80
              ${isActive("/profile")
                ? isDarkMode
                  ? "ring-2 ring-gray-400 ring-offset-2 ring-offset-gray-900"
                  : "ring-2 ring-blue-500 ring-offset-2"
                : ""} 
              ${isDarkMode ? "bg-gray-600 text-white" : "bg-blue-600 text-white"}`}
          >
            {userInitial}
          </button>
        ) : (
          <button
            className={`p-2 rounded-lg text-sm transition-all
              ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
            onClick={handleLogin}
          >
            Login
          </button>
        )}

        {/* Logout Button */}
        {userInitial && (
          <div
            title="Logout"
            className={bottomButtonClass}
            onClick={handleLogout}
          >
            <GiEntryDoor size={22} color="gray" />
          </div>
        )}

        {/* Theme Toggle */}
        <button
          title="Theme"
          onClick={toggleTheme}
          className={bottomButtonClass}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" color="orange" />
          ) : (
            <Moon className="w-5 h-5" color="gray" />
          )}
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
