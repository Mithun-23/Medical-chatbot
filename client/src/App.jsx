import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import Signup from "./Components/Signup";
import Chatbot from "./Components/Chatbot";
import Voice from "./Components/Voice";
import HomePage from "./Components/HomePage";
import FitbitLogin from "./Components/FitbitLogin";
import FitbitCallback from "./Components/FitbitCallback";
import Dashboard from "./Components/Dashboard";
import GameSelector from "./Components/GameSelector";
import GamePage from "./Components/GamePage";
import Profile from "./Components/Profile";
import Music from "./Music";
import Game from "./Components/Game";
import { AuthProvider } from "./UserContext";
import Camera from "./Components/Camera";
import Graph from "./Components/Graph";
import MainLayout from "./Components/MainLayout";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        localStorage.setItem("userId", user.uid);

        // Record daily check-in
        try {
          const userEmail = user.email;
          await axios.post("http://localhost:8000/api/checkin", {
            userId: userEmail
          });
          console.log("✅ Daily check-in recorded");
        } catch (error) {
          console.error("Error recording check-in:", error);
        }
      } else {
        setUser(null);
        localStorage.removeItem("userId");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes with sidebar (wrapped in MainLayout) */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/voice" element={<Voice />} />
            <Route path="/FitbitLogin" element={<FitbitLogin />} />
            <Route path="/callback" element={<FitbitCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/game-selector" element={<GameSelector />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/music" element={<Music />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/game" element={<Game />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

