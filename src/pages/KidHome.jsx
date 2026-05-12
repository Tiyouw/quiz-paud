import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './KidHome.css';

function KidHome() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, []);

  async function fetchChapters() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Gagal memuat bab:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kid-home-wrapper">
      <header className="kid-home-header">
        <h1>Halo, Teman Pintar! 👋</h1>
        <p>Yuk, pilih bab yang kamu suka!</p>
      </header>

      <section className="kid-chapter-section">
        {loading ? (
          <p className="kid-loading">Memuat bab...</p>
        ) : chapters.length > 0 ? (
          <div className="kid-chapter-grid">
            {chapters.map((chapter) => (
              <div className="kid-chapter-card" key={chapter.id}>
                <div className="kid-card-top">
                  <div className="kid-icon-circle">{chapter.icon || '⭐'}</div>
                  <span className="kid-chapter-category">{chapter.Category || 'Umum'}</span>
                </div>

                <h3>{chapter.title}</h3>
                <p className="kid-meta-text">{chapter.description || 'Mari belajar bersama!'}</p>

                <Link to={`/quiz/${chapter.id}`} className="kid-start-btn">
                  🚀 Mulai Quiz
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="kid-empty">
            <p>Belum ada bab. Sabar ya, guru akan menambahkannya nanti!</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default KidHome;
