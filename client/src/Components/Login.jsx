import React, { useState } from "react";
import { X } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, GoogleProvider, GithubProvider } from "./Firebase";
import { useNavigate } from "react-router-dom";
import google from "../assets/google.jpeg";
import Github from "../assets/github.png";


const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Loading state


  // Handle Email/Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      localStorage.setItem("Email", user.email);
      console.log("Login successful:", user.email);

      await storeLoginDate(user); // Store login date
      navigate("/chatbot");
    } catch (err) {
      console.error("Login error:", err);
    }
    setLoading(false);
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, GoogleProvider);
      const user = result.user;

      localStorage.setItem("Email", user.email);
      localStorage.setItem("Name", user.displayName);
      console.log("Google sign-in successful:", user.displayName);

      navigate("/chatbot");
    } catch (err) {
      console.error("Google Sign-In error:", err);
    }
  };

  // Handle GitHub Sign-In
  const handleGithubSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, GithubProvider);
      const user = result.user;

      localStorage.setItem("Email", user.email);
      console.log("GitHub sign-in successful:", user.email);

      await storeLoginDate(user); // Store login date
      navigate("/chatbot");
    } catch (err) {
      console.error("GitHub Sign-In error:", err);
    }
  };

  return (
    <div className="flex flex-col italic items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-800 text-white p-6 rounded-t-lg">
            <h2 className="text-2xl font-semibold">Login</h2>
            <button
              onClick={() => navigate("/")}
              className="text-white hover:text-purple-200 transition duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Login Form */}
          <form className="p-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center">
                <label htmlFor="email" className="w-1/3 text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex items-baseline">
                <label htmlFor="password" className="w-1/3 text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 text-black border border-gray-800 rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {/* OR Divider */}
              <div className="flex justify-center my-2">
                <p className="text-gray-600">or</p>
              </div>

              {/* Social Logins */}
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-300 transition duration-300 hover:bg-gray-100"
                >
                  <img src={google} alt="Google Logo" className="w-8 h-8 rounded-full" />
                </button>

                <button
                  type="button"
                  onClick={handleGithubSignIn}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-300 transition duration-300 hover:bg-gray-100"
                >
                  <img src={Github} alt="GitHub Logo" className="w-8 h-8 rounded-full" />
                </button>
              </div>

              {/* Links */}
              <div className="px-6 pb-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <a href="/signup" className="text-gray-600 hover:text-gray-800 font-medium underline">
                    Sign Up
                  </a>
                </p>
              </div>
              <div className="px-6 pb-6 text-center text-gray-600 font-medium">
                Learn more?
                <a href="/" className="hover:text-gray-800 underline pl-2">
                  Home
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
