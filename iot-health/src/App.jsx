import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginSignup from './pages/LoginSignup';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

// This component protects routes that require a user to be logged in
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// This component protects routes that are only for admins
const AdminRoute = ({ user, children }) => {
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This effect runs only once when the app first loads
  useEffect(() => {
    try {
      const loggedInUser = localStorage.getItem('user');
      if (loggedInUser) {
        const foundUser = JSON.parse(loggedInUser);
        setUser(foundUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* THE CRUCIAL FIX IS HERE */}
        <Route
          path="/"
          element={
            user ? (
              // If a user is logged in, check their role and navigate accordingly.
              // This fixes the refresh redirect issue for admins.
              <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
            ) : (
              // If no user, show the login page.
              <LoginSignup onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute user={user}>
              <AdminPanel user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
