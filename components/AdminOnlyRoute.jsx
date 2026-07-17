import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminSession } from '@/services/corrections';

const hasUsableSession = (session) => {
  if (!session?.access_token) return false;
  if (!session.expires_at) return true;
  return Number(session.expires_at) * 1000 > Date.now();
};

const AdminOnlyRoute = ({ children }) => {
  const location = useLocation();
  const session = getAdminSession();

  if (!hasUsableSession(session)) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default AdminOnlyRoute;
