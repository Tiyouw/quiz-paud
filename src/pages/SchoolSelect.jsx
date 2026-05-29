import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSchool } from '../contexts/SchoolContext';
import './SchoolSelect.css';

function SchoolSelect() {
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [activeSchool, setActiveSchool] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const { selectSchool } = useSchool();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error: fetchError } = await supabase
        .from('schools')
        .select('id, name');

      if (fetchError) {
        console.error('Error fetching schools:', fetchError);
      } else {
        setSchools(data || []);
      }
      setLoadingSchools(false);
    };

    fetchSchools();
  }, []);

  const handleCardClick = (school) => {
    setActiveSchool(school);
    setCodeInput('');
    setError('');
  };

  const handleCloseModal = () => {
    setActiveSchool(null);
    setCodeInput('');
    setError('');
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      setError('Masukkan kode akses');
      return;
    }

    setVerifying(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', activeSchool.id)
      .eq('access_code', codeInput.trim())
      .single();

    if (queryError || !data) {
      setError('Kode akses salah');
      setVerifying(false);
      return;
    }

    selectSchool({ id: data.id, name: data.name });
    setVerifying(false);
    navigate('/');
  };

  return (
    <div className="school-select-page">
      <div className="school-select-header">
        <img
          src="/LogoFull-SiKecilPintar.png"
          alt="SiKecilPintar"
          className="school-select-logo"
        />
        <h1 className="school-select-title">Pilih Sekolah Anda</h1>
      </div>

      {loadingSchools ? (
        <div className="school-select-loading">Memuat daftar sekolah...</div>
      ) : schools.length === 0 ? (
        <div className="school-select-empty">Belum ada sekolah terdaftar.</div>
      ) : (
        <div className="school-grid">
          {schools.map((school) => (
            <button
              key={school.id}
              className="school-card"
              onClick={() => handleCardClick(school)}
              type="button"
            >
              <span className="school-card-icon">🏫</span>
              <span className="school-card-name">{school.name}</span>
            </button>
          ))}
        </div>
      )}

      {activeSchool && (
        <div className="school-modal-overlay" onClick={handleCloseModal}>
          <div className="school-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="school-modal-title">{activeSchool.name}</h2>
            <form onSubmit={handleSubmitCode} className="school-modal-form">
              <label htmlFor="access-code" className="school-modal-label">
                Masukkan kode akses
              </label>
              <input
                id="access-code"
                type="text"
                className="school-modal-input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Kode akses"
                autoFocus
                autoComplete="off"
              />
              {error && <p className="school-modal-error">{error}</p>}
              <button
                type="submit"
                className="school-modal-submit"
                disabled={verifying}
              >
                {verifying ? 'Memverifikasi...' : 'Masuk'}
              </button>
            </form>
            <button
              type="button"
              className="school-modal-close"
              onClick={handleCloseModal}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolSelect;
