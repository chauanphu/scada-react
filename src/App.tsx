import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { TenantPage } from "./pages/TenantPage";
import { DevicesPage } from "./pages/DevicesPage";
import { UsersPage } from "./pages/UsersPage";
import { AuditPage } from "./pages/AuditPage";
import { FirmwarePage } from "./pages/FirmwarePage";
import { AlertPage } from "./pages/AlertPage";
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
                <Route path="tenants" element={<TenantPage />} />
                <Route path="devices" element={<DevicesPage />} />
                <Route path="users" element={<UsersPage />} />
                {/* <Route path="roles" element={<RolesPage />} /> */}
                <Route path="audit" element={<AuditPage />} />
                <Route path="firmware" element={<FirmwarePage />} />
                <Route path="alerts" element={<AlertPage />} />
              </Route>
            </Routes>
          </WebSocketProvider>
        </ToastProvider>
      </APIProvider>
    </Router>
  );
}

export default App;
