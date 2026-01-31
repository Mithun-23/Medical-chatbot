import React, { useState, useEffect, useContext } from "react";
import {
  MessageSquare,
  Music,
  Mic,
  Activity,
  Gamepad2,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
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

  const isActive = (path) => location.pathname === path;

  // Navigation items
  const navItems = [
    { path: "/chatbot", icon: MessageSquare, label: "Chat" },
    { path: "/music", icon: Music, label: "Music" },
    { path: "/voice", icon: Mic, label: "Voice" },
    { path: "/dashboard", icon: Activity, label: "Health" },
    { path: "/game-selector", icon: Gamepad2, label: "Games" },
  ];

  return (
    <div
      className={`fixed h-screen w-44 backdrop-blur-sm border-r flex flex-col py-4 z-20
        ${isDarkMode ? "bg-gray-900 text-white border-gray-800" : "bg-white text-gray-800 border-gray-200"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
            bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg`}
        >
          Dr
        </div>
        <span className="font-bold text-lg">Chat</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left
                ${active
                  ? isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  : isDarkMode
                    ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col gap-1 px-2 mt-auto pt-4 border-t border-gray-700/30">
        {/* Profile / Login */}
        {userInitial ? (
          <button
            onClick={() => navigate("/profile")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isActive("/profile")
                ? isDarkMode
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : isDarkMode
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${isDarkMode ? "bg-gray-700" : "bg-blue-100"}`}>
              {userInitial}
            </div>
            <span className="text-sm font-medium">Profile</span>
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isDarkMode
                ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
          >
            <User size={18} className="shrink-0" />
            <span className="text-sm font-medium">Login</span>
          </button>
        )}

        {/* Logout */}
        {userInitial && (
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isDarkMode
                ? "hover:bg-red-900/50 text-gray-400 hover:text-red-400"
                : "hover:bg-red-50 text-gray-600 hover:text-red-600"
              }`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
            ${isDarkMode
              ? "hover:bg-gray-800 text-gray-400 hover:text-yellow-400"
              : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
        >
          {isDarkMode ? (
            <Sun size={18} className="shrink-0 text-yellow-400" />
          ) : (
            <Moon size={18} className="shrink-0" />
          )}
          <span className="text-sm font-medium">
            {isDarkMode ? "Light" : "Dark"}
          </span>
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

