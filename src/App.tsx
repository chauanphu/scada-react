import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { DevicesPage } from "./pages/DevicesPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { AuditPage } from "./pages/AuditPage";
import { APIProvider } from "./contexts/APIProvider";
import { WebSocketProvider } from "./contexts/WebsocketProvider";
import { ToastProvider } from "./contexts/ToastProvider";
import RootLayout from "./RootLayout";

function App() {
  return (
    <Router>
      <APIProvider>
        <ToastProvider>
          <WebSocketProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route path="devices" element={<DevicesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="audit" element={<AuditPage />} />
              </Route>
            </Routes>
          </WebSocketProvider>
        </ToastProvider>
      </APIProvider>
    </Router>
  );
}

export default App;
