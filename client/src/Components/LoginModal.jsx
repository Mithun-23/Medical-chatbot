import React, { useState, useContext } from "react";
import { X } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, GoogleProvider, GithubProvider } from "./Firebase";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import google from "../assets/google.jpeg";
import Github from "../assets/github.png";

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const { isDarkMode } = useContext(ThemeContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Handle successful login
    const handleLoginSuccess = () => {
        setEmail("");
        setPassword("");
        setError("");
        if (onSuccess) {
            onSuccess();
        } else {
            navigate("/chatbot");
        }
        onClose();
    };

    // Handle Email/Password Login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            localStorage.setItem("Email", user.email);
            console.log("Login successful:", user.email);

            handleLoginSuccess();
        } catch (err) {
            console.error("Login error:", err);
            setError("Invalid email or password. Please try again.");
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

            handleLoginSuccess();
        } catch (err) {
            console.error("Google Sign-In error:", err);
            setError("Google sign-in failed. Please try again.");
        }
    };

    // Handle GitHub Sign-In
    const handleGithubSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, GithubProvider);
            const user = result.user;

            localStorage.setItem("Email", user.email);
            console.log("GitHub sign-in successful:", user.email);

            handleLoginSuccess();
        } catch (err) {
            console.error("GitHub Sign-In error:", err);
            setError("GitHub sign-in failed. Please try again.");
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={handleBackdropClick}
        >
            <div
                className={`rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slideUp ${isDarkMode ? "bg-gray-800" : "bg-white"
                    }`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 rounded-t-xl ${isDarkMode ? "bg-gray-700" : "bg-blue-600"
                    }`}>
                    <h2 className="text-2xl font-semibold text-white">Login</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition duration-200 p-1 rounded-full hover:bg-white/10"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Login Form */}
                <form className="p-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"
                                    }`}
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        : "bg-white border-gray-300 text-black placeholder-gray-500"
                                    }`}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"
                                    }`}
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        : "bg-white border-gray-300 text-black placeholder-gray-500"
                                    }`}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`w-full font-semibold py-2.5 px-4 rounded-lg transition duration-300 ${isDarkMode
                                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            disabled={loading}
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>

                        {/* OR Divider */}
                        <div className="flex items-center my-4">
                            <div className={`flex-1 border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}></div>
                            <span className={`px-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>or</span>
                            <div className={`flex-1 border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}></div>
                        </div>

                        {/* Social Logins */}
                        <div className="flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className={`flex items-center justify-center w-12 h-12 rounded-full border transition duration-300 ${isDarkMode
                                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                        : "bg-white border-gray-300 hover:bg-gray-100"
                                    }`}
                            >
                                <img src={google} alt="Google" className="w-8 h-8 rounded-full" />
                            </button>

                            <button
                                type="button"
                                onClick={handleGithubSignIn}
                                className={`flex items-center justify-center w-12 h-12 rounded-full border transition duration-300 ${isDarkMode
                                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                                        : "bg-white border-gray-300 hover:bg-gray-100"
                                    }`}
                            >
                                <img src={Github} alt="GitHub" className="w-8 h-8 rounded-full" />
                            </button>
                        </div>

                        {/* Links */}
                        <div className="text-center pt-4">
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Don't have an account?{" "}
                                <a
                                    href="/signup"
                                    className={`font-medium underline ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"
                                        }`}
                                >
                                    Sign Up
                                </a>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
