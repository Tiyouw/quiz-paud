import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';

function TopNav() {
  const { isTeacher, signOut, loading } = useAuth();
  const { selectedSchool, clearSchool } = useSchool();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleChangeSchool = () => {
    clearSchool();
    navigate('/select-school');
  };

  return (
    <nav className="admin-topbar">
      <div className="topbar-left">
        <img
          src="/LogoFull-SiKecilPintar.png"
          alt="SiKecilPintar"
          className="logo-image"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'inline';
          }}
        />
        <h1 className="logo-text" style={{ display: 'none' }}>SiKecilPintar</h1>
        {!loading && isTeacher && selectedSchool && (
          <span className="school-badge">{selectedSchool.name}</span>
        )}
      </div>

      <div className="topbar-right">
        {!loading && isTeacher && selectedSchool && (
          <button type="button" className="btn-auth-action btn-change-school" onClick={handleChangeSchool}>
            Ganti Sekolah
          </button>
        )}
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
