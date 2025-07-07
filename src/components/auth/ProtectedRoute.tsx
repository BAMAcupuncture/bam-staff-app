import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const { profile, profileLoading } = useProfile();

  // Wait for both auth and profile loads
  if (loading || profileLoading) {
    return <p className="p-4">Loading...</p>;
  }

  // If not logged in, redirect to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user doc not found in team collection, redirect to /profile-setup
  if (!profile) {
    return <Navigate to="/profile-setup" replace />;
  }

  // Otherwise, allow access
  return <Outlet />;
};

export default ProtectedRoute;