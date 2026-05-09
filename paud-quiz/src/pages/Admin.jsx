import React from 'react';
import './Admin.css';

function Admin() {
  return (
    <div className="admin-wrapper">
      {/* Top Navbar */}
      <nav className="admin-topbar">
        <div className="topbar-left">
          <span className="icon-menu">☰</span>
          <h1 className="logo-text">SiKecilPintar</h1>
        </div>
        <span className="icon-settings">⚙️</span>
      </nav>

      {/* Header Section */}
      <header className="admin-header">
        <h2>Dasbor Kuis</h2>
        <p>
          Kelola konten edukasi Anda dan pantau kemajuan siswa dengan mudah. 
          Semua yang Anda butuhkan untuk memelihara keingintahuan si kecil ada di sini.
        </p>
        <button className="btn-add">
          <span className="icon-plus">⊕</span> Tambah Soal Baru
        </button>
      </header>

      {/* Chapters Section */}
      <section className="admin-section">
        <div className="section-title">
          <h3>Bab Saat Ini</h3>
          <a href="#" className="view-all">Lihat Semua</a>
        </div>

        <div className="chapter-list">
          {/* Card 1 */}
          <div className="chapter-card">
            <div className="card-top">
              <div className="icon-circle light-blue">🧮</div>
              <div className="card-actions">
                <button>✎</button>
                <button>🗑️</button>
              </div>
            </div>
            <h4>Angka & Bentuk</h4>
            <p className="meta-text">12 Soal • Diperbarui 2 hari yang lalu</p>
            <div className="badges">
              <span className="badge bg-green">Matematika</span>
              <span className="badge bg-pink">Level 1</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="chapter-card">
            <div className="card-top">
              <div className="icon-circle light-green">🖌️</div>
              <div className="card-actions">
                <button>✎</button>
                <button>🗑️</button>
              </div>
            </div>
            <h4>Warna Alam</h4>
            <p className="meta-text">8 Soal • Diperbarui 5 hari yang lalu</p>
            <div className="badges">
              <span className="badge bg-green">Seni</span>
              <span className="badge bg-pink">Level 1</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="chapter-card">
            <div className="card-top">
              <div className="icon-circle light-pink">📖</div>
              <div className="card-actions">
                <button>✎</button>
                <button>🗑️</button>
              </div>
            </div>
            <h4>Waktu Cerita ABC</h4>
            <p className="meta-text">15 Soal • Diperbarui kemarin</p>
            <div className="badges">
              <span className="badge bg-green">Bahasa</span>
              <span className="badge bg-pink">Level 2</span>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="history-section">
        <h3>Riwayat Kuis Siswa</h3>
        <p className="subtitle">Performa terbaru di semua bab aktif</p>
        
        <div className="search-box">
          <span className="icon-search">🔍</span>
          <input type="text" placeholder="Cari siswa..." />
        </div>

        <table className="history-table">
          <thead>
            <tr>
              <th>Nama Siswa</th>
              <th>Bab</th>
              <th>Skor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="student-info">
                  <div className="avatar bg-light-blue">AM</div>
                  <span>Aria Miller</span>
                </div>
              </td>
              <td>Angka & Bentuk</td>
              <td><div className="score-bar bar-blue"></div></td>
            </tr>
            <tr>
              <td>
                <div className="student-info">
                  <div className="avatar bg-light-green">LB</div>
                  <span>Leo Brooks</span>
                </div>
              </td>
              <td>Waktu Cerita ABC</td>
              <td><div className="score-bar bar-green"></div></td>
            </tr>
            <tr>
              <td>
                <div className="student-info">
                  <div className="avatar bg-light-pink">SC</div>
                  <span>Sam Chen</span>
                </div>
              </td>
              <td>Warna Alam</td>
              <td><div className="score-bar bar-purple"></div></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="nav-item active">
          <span className="icon">🏠</span>
          <span>Beranda</span>
        </div>
        <div className="nav-item">
          <span className="icon">📚</span>
          <span>Pelajaran</span>
        </div>
        <div className="nav-item">
          <span className="icon">🏆</span>
          <span>Penghargaan</span>
        </div>
        <div className="nav-item">
          <span className="icon">👤</span>
          <span>Profil</span>
        </div>
      </nav>
    </div>
  );
}

export default Admin;