import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';

const SystemAdminRoute: React.FC = () => {
  const { profile } = useProfile();

  // Only proceed if isSystemAccount = true
  if (!profile?.isSystemAccount) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default SystemAdminRoute;