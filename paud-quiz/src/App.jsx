import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Admin from './pages/Admin'; // Mengimpor halaman Admin

// --- KOMPONEN BERANDA (TAMPILAN ANAK) ---
function Home() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, []);

  async function fetchChapters() {
    try {
      const { data, error } = await supabase.from('chapters').select('*');
      if (error) throw error;
      setChapters(data);
    } catch (error) {
      console.error("Error fetching chapters:", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Memuat petualangan...</div>;

  return (
    <div className="app-container">
      {/* Navbar khusus tampilan Anak */}
      <nav className="navbar">
        <Link to="/" className="nav-logo">🌸 SiKecilPintar</Link>
        <div className="nav-links">
          <Link to="/" className="nav-item">Beranda</Link>
          <Link to="/admin" className="nav-item">Panel Guru</Link>
        </div>
      </nav>

      <main className="main-content">
        <div className="dashboard">
          <header className="dashboard-header">
            <h1>Halo, Adik Pintar! 👋</h1>
            <p>Mau belajar apa hari ini? Pilih bab di bawah ya!</p>
          </header>

          <div className="chapter-grid">
            {chapters.length > 0 ? (
              chapters.map((chapter) => (
                <Link to={`/quiz/${chapter.id}`} key={chapter.id} className="chapter-card">
                  <div className="chapter-icon">{chapter.icon || '⭐'}</div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.description}</p>
                  <span className="play-btn">Main Yuk!</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>Belum ada bab kuis nih. Yuk, minta Ibu/Bapak Guru tambah soal di Panel Guru!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- KOMPONEN KUIS (SEMENTARA) ---
function Quiz() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <Link to="/" className="nav-logo">🌸 SiKecilPintar</Link>
      </nav>
      <main className="main-content">
        <h2>Halaman Kuis Sedang Dibangun 🛠️</h2>
        <Link to="/" className="play-btn" style={{marginTop: '20px', display: 'inline-block'}}>Kembali</Link>
      </main>
    </div>
  );
}

// --- KOMPONEN UTAMA (ROUTING) ---
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/quiz/:chapterId" element={<Quiz />} />
    </Routes>
  );
}

export default App;