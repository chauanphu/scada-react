import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAPI } from "./contexts/APIProvider";
import { Navbar } from "./components/NavBar";
import Footer from "./components/Footer";
import { useState, useEffect } from "react";

const RootLayout = () => {
  const apiContext = useAPI();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className={`${location.pathname === '/' ? 'container mx-auto w-full px-4' : 'container mx-auto px-4'} py-8 flex-grow`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;