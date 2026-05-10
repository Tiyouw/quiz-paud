import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Scores.css';

function Scores() {
  const [scores, setScores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  async function fetchScores() {
    try {
      setLoading(true);
      // Mengambil data skor, pastikan tabel 'scores' sudah ada di Supabase
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          student_name,
          score,
          created_at,
          chapters (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScores(data);
    } catch (error) {
      console.error("Error fetching scores:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // Filter pencarian berdasarkan nama siswa
  const filteredScores = scores.filter(score =>
    score.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="scores-wrapper">
      {/* <nav className="admin-topbar">
        <div className="topbar-left">
          <span className="icon-menu">☰</span>
          <h1 className="logo-text">SiKecilPintar</h1>
        </div>
        <span className="icon-settings">⚙️</span>
      </nav> */}

      <header className="scores-header">
        <h2>Riwayat Skor Siswa</h2>
        <p>Pantau hasil belajar dan perkembangan kuis seluruh siswa di sini.</p>
      </header>

      <section className="scores-content">
        <div className="search-container">
          <span className="icon-search">🔍</span>
          <input 
            type="text" 
            placeholder="Cari nama siswa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table className="scores-table">
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>Bab Kuis</th>
                <th>Tanggal</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4">Memuat data nilai...</td></tr>
              ) : filteredScores.length > 0 ? (
                filteredScores.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="student-profile">
                        <div className="student-avatar">
                          {item.student_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{item.student_name}</span>
                      </div>
                    </td>
                    <td>{item.chapters?.title || 'Umum'}</td>
                    <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div className="score-badge">
                        {item.score}/100
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4">Tidak ada data ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Navigation
      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <span className="icon">🏠</span>
          <span>Beranda</span>
        </Link>
        <Link to="/lessons" className="nav-item">
          <span className="icon">📚</span>
          <span>Pelajaran</span>
        </Link>
        <Link to="/scores" className="nav-item active">
          <span className="icon">📊</span>
          <span>Skor</span>
        </Link>
      </nav> */}
    </div>
  );
}

export default Scores;