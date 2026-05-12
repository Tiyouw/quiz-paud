import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { isTeacher, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#2D6A76', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
        Memuat...
      </div>
    );
  }

  if (!isTeacher) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
