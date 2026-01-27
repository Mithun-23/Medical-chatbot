import React, { useContext } from "react";
import Sidebar from "./Sidebar";
import { ThemeContext } from "./ThemeContext";

const FitbitLogin = () => {
  const {isDarkMode , setIsDarkMode} = useContext(ThemeContext);
  const CLIENT_ID = import.meta.env.VITE_FITBIT_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_FITBIT_REDIRECT_URI;
  console.log(REDIRECT_URI);
  console.log(CLIENT_ID);
  const AUTH_URL = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=activity%20heartrate%20sleep%20profile`;

  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex flex-col items-center justify-center min-h-screen w-full ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className={`p-8 rounded-2xl shadow-lg max-w-sm w-full text-center ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>
            Connect with Fitbit
          </h2>
          <p className={`mb-6 ${isDarkMode? "text-white" : "text-gray-900" }`}>
            Sync your activity, heart rate, and sleep data.
          </p>
          <a href={AUTH_URL}>
            <button
              className={`font-semibold px-6 py-3 rounded-lg transition-all
                ${isDarkMode
                  ? "bg-gray-200 hover:bg-gray-600 text-gray-900"  // Dark Mode
                  : "bg-gray-900 hover:bg-blue-700 text-white" // Light Mode
                }`}
            >
              Login
            </button>
          </a>

        </div>
      </div>
    </div>
  );
};

export default FitbitLogin;