import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './customprocess/AuthContext';
import ReceiptManagement from './pages/ReceiptManagement';
import ReviewReceipt from './pages/ReviewReceipt';
import TestPage from './components/TestPage';

export function App() {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          accessToken
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipt"
        element={
          <ProtectedRoute>
            <ReceiptManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/review-receipt/:receiptId" 
        element={
          <ProtectedRoute>
            <ReviewReceipt />
          </ProtectedRoute>
        }
      />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  );
}

export default App;