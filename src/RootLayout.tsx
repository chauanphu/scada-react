import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAPI } from "./contexts/APIProvider";
import { Navbar } from "./components/NavBar";

// Layout chính của ứng dụng
const RootLayout: React.FC = () => {
  const apiContext = useAPI();

  // Chuyển hướng về trang đăng nhập nếu chưa xác thực
  if (!apiContext?.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Thanh điều hướng */}
      <Navbar />
      {/* Nội dung chính */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
