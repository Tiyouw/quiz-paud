import React from 'react';

function TopNav() {
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
      {/* <span className="icon-settings">⚙️</span> */}
    </nav>
  );
}

export default TopNav;
