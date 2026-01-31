import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

const FitbitLogin = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const CLIENT_ID = import.meta.env.VITE_FITBIT_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_FITBIT_REDIRECT_URI;
  const AUTH_URL = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=activity%20heartrate%20sleep%20profile`;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
          <span className="text-4xl">⌚</span>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Connect Your Fitbit
        </h2>

        {/* Description */}
        <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Sync your activity, heart rate, and sleep data to unlock personalized health insights and AI-powered recommendations.
        </p>

        {/* Features */}
        <div className={`grid grid-cols-2 gap-3 mb-6 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <span className="text-xl">❤️</span>
            <p className="mt-1">Heart Rate</p>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <span className="text-xl">🚶</span>
            <p className="mt-1">Steps</p>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <span className="text-xl">😴</span>
            <p className="mt-1">Sleep</p>
          </div>
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <span className="text-xl">🔥</span>
            <p className="mt-1">Calories</p>
          </div>
        </div>

        {/* Connect Button */}
        <a href={AUTH_URL} className="block">
          <button
            className="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold 
              rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl 
              transform hover:-translate-y-0.5"
          >
            Connect Fitbit
          </button>
        </a>

        {/* Privacy note */}
        <p className={`mt-4 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          🔒 Your data is secure and only used for health insights
        </p>
      </div>
    </div>
  );
};

export default FitbitLogin;