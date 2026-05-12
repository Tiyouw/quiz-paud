import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isTeacher, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const redirectTo = location.state?.from?.pathname || '/';

  // Kalau sudah login, jangan tampilkan halaman login
  useEffect(() => {
    if (!loading && isTeacher) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, isTeacher, navigate, redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login error:', err.message);
      setErrorMsg('Email atau kata sandi salah.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-icon">🔐</div>
        <h2>Masuk sebagai Guru</h2>
        <p className="login-sub">Silakan masuk untuk mengelola bab dan soal.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="guru@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Kata Sandi</label>
            <input
              type="password"
              required
              placeholder="Kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {errorMsg && <div className="login-error">{errorMsg}</div>}

          <button type="submit" className="btn-login" disabled={submitting}>
            {submitting ? 'Memuat...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
