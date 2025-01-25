import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAPI } from "./contexts/APIProvider";
import { Navbar } from "./components/NavBar";

const RootLayout: React.FC = () => {
  const apiContext = useAPI();

  if (!apiContext?.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
