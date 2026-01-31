import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ThemeContext } from "./ThemeContext";

export default function MainLayout() {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <div className={`min-h-screen flex ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
            <Sidebar />
            <main className="flex-1 ml-44">
                <Outlet />
            </main>
        </div>
    );
}
