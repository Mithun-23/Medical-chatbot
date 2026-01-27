import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Chatbot from "./Components/Chatbot";
import Voice from "./Components/Voice";
import HomePage from "./Components/HomePage";
import FitbitLogin from "./Components/FitbitLogin";
import FitbitCallback from "./Components/FitbitCallback";
import Dashboard from "./Components/Dashboard";
import GameSelector from "./Components/GameSelector";
import Profile from "./Components/Profile";
import Music from "./Music";
import Game from "./Components/Game";
import { AuthProvider } from "./UserContext";
import Camera from "./Components/Camera";
import Graph from "./Components/Graph";

function App() {
  const [user, setUser] = useState(null);
  const [showIframe, setShowIframe] = useState(false);

  const handleMusic = () => {
    setShowIframe(true);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        localStorage.setItem("userId", user.uid);
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
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/FitbitLogin" element={<FitbitLogin />} />
          <Route path="/callback" element={<FitbitCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/game-selector" element={<GameSelector />} />
         <Route path="/callback" element={<FitbitCallback />} />
         <Route path="/game-selector" element={<GameSelector />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/music" element={<Music showIframe={showIframe} />} />
          <Route path="/graph" element={<Graph />} />

         <Route path="/game" element={<Game />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
