import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Admin.css';

function Admin() {
  const [chapters, setChapters] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Mengambil 3 Bab dari database
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .limit(3);

      // Mengambil 10 Riwayat skor terbaru
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select('*, chapters(title)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);
      setScores(scoresData || []);
    } catch (error) {
      console.error("Error loading dashboard:", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-wrapper">
      <header className="admin-header">
        <h2>Halo, Guru Pintar! 👋</h2>
        <p>Mari lihat ringkasan aktivitas belajar hari ini.</p>
      </header>

      {/* Bagian Bab */}
      <section className="admin-section">
        <div className="section-title">
          <h3>Bab Pilihan</h3>
          <Link to="/lessons" className="view-all">Lihat Semua</Link>
        </div>

        <div className="chapter-list">
          {loading ? (
            <p>Memuat bab...</p>
          ) : chapters.length > 0 ? (
            chapters.map((chapter) => (
              <div className="chapter-card" key={chapter.id}>
                <div className="card-top">
                  <div className="card-top-left">
                    <div className="icon-circle bg-light-blue">
                      {chapter.icon || '⭐'}
                    </div>
                    <span className="chapter-category">
                      {chapter.Category || 'Umum'}
                    </span>
                  </div>
                  
                  <div className="card-actions">
                    <button className="edit-btn">📝</button>
                    <button className="delete-btn">🗑️</button>
                  </div>
                </div>
                
                <h4>{chapter.title}</h4>
                <p className="meta-text">{chapter.description || 'Mari belajar bersama!'}</p>
                
                <Link to={`/quiz/${chapter.id}`} className="start-quiz-btn">
                  Mulai Quiz
                </Link>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Belum ada bab di database.</p>
            </div>
          )}
        </div>
      </section>

      {/* Bagian Riwayat Skor */}
      <section className="history-section">
        <div className="section-title">
          <h3>Riwayat Terbaru</h3>
          <Link to="/scores" className="view-all">Lihat Semua</Link>
        </div>
        
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Bab</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {scores.length > 0 ? (
                scores.map((score) => (
                  <tr key={score.id}>
                    <td>
                      <div className="student-info">
                        <div className="avatar">
                          {score.student_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{score.student_name}</span>
                      </div>
                    </td>
                    <td>{score.chapters?.title || 'Umum'}</td>
                    <td><span className="score-text">{score.score}/100</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                    Belum ada riwayat nilai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Admin;