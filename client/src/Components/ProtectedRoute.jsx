import React, { useState, useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginModal from './LoginModal';
import { ThemeContext } from './ThemeContext';

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isDarkMode } = useContext(ThemeContext);
    const location = useLocation();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                localStorage.setItem('Email', user.email);
                localStorage.setItem('userId', user.uid);
                if (user.displayName) {
                    localStorage.setItem('Name', user.displayName);
                }
            } else {
                setIsAuthenticated(false);
                // Show login modal for unauthenticated users
                setShowLoginModal(true);
            }
        });

        return () => unsubscribe();
    }, []);

    // Loading state
    if (isAuthenticated === null) {
        return (
            <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-gray-600' : 'border-blue-500'}`}></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login modal over homepage-like background
    if (!isAuthenticated) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-center h-screen">
                    <div className={`text-center p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Authentication Required
                        </h2>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Please log in to access this page.
                        </p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            Log In
                        </button>
                    </div>
                </div>

                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            </div>
        );
    }

    // Authenticated - render children
    return children;
};

export default ProtectedRoute;
