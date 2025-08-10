import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../customprocess/AuthContext';

export default function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!accessToken) return <Navigate to="/" replace />;

  return children;
}