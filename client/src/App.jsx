import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WorkspaceSelection from './pages/WorkspaceSelection';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AcceptInvite from './pages/AcceptInvite';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="/login" element={<Login />} />
          <Route path="/select-workspace" element={<WorkspaceSelection />} />
          <Route path="/w/:workspaceId/*" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
