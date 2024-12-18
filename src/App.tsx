import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RootLayout from './RootLayout';
import HomePage from "./pages/HomePage";
import LoginPage from './pages/LoginPage';
import "./index.css";
import UserPage from './pages/UserPage';
import ClusterPage from './pages/ClusterPage';
import ReportPage from './pages/ReportPage';
import ChangelogPage from './pages/ChangelogPage';
import TaskPage from './pages/TaskPage';

function App() {
  return (
    <Router>
      <RootLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Add other routes */}
          <Route path="/user" element={<UserPage />} />
          <Route path="/cluster" element={<ClusterPage />} />
          <Route path="/report/:unitId?" element={<ReportPage />} />
          <Route path="/changelog" element={<ChangelogPage />} /> 
          <Route path="/task" element={<TaskPage />} />
        </Routes>
      </RootLayout>
    </Router>
  );
}

export default App;