import { Navigate, Outlet } from "react-router-dom";
import { useAPI } from "./contexts/APIProvider";
import { Navbar } from "./components/NavBar";
import { useState, useEffect } from "react";

const RootLayout = () => {
  const apiContext = useAPI();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const validateUser = async () => {
      await apiContext?.validateToken();
      setCheckingAuth(false);
    };
    validateUser();
  }, []);

  if (checkingAuth) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!apiContext?.isAuthenticated) {
    console.log("Redirecting to login");
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className={`${location.pathname === '/' ? 'px-4 mx-5' : 'container mx-auto px-4'} py-8`}>
      <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
