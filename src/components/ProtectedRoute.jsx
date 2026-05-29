import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';

function ProtectedRoute({ children }) {
  const { isTeacher, loading } = useAuth();
  const { selectedSchool, loading: schoolLoading } = useSchool();
  const location = useLocation();

  if (loading || schoolLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#2D6A76', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
        Memuat...
      </div>
    );
  }

  if (!isTeacher) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!selectedSchool) {
    return <Navigate to="/select-school" replace />;
  }

  return children;
}

export default ProtectedRoute;
