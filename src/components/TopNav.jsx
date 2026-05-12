import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TopNav() {
  const { isTeacher, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="admin-topbar">
      <div className="topbar-left">
        {/* Ganti /logo.png dengan nama file logo kamu di folder public/ */}
        <img
          src="/LogoFull-SiKecilPintar.png"
          alt="SiKecilPintar"
          className="logo-image"
          onError={(e) => {
            // Fallback ke teks kalau file logo.png belum ada
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'inline';
          }}
        />
        <h1 className="logo-text" style={{ display: 'none' }}>SiKecilPintar</h1>
      </div>

      <div className="topbar-right">
        {!loading && isTeacher && (
          <button type="button" className="btn-auth-action" onClick={handleLogout}>
            Keluar
          </button>
        )}
      </div>
    </nav>
  );
}

export default TopNav;
