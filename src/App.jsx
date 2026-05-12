import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Admin from './pages/Admin';
import KidHome from './pages/KidHome';
import Login from './pages/Login';
import Lessons from './pages/Lessons';
import Scores from './pages/Scores';
import ChapterDetail from './pages/ChapterDetail';
import Quiz from './pages/Quiz';
import './App.css';

// Pilih Beranda sesuai status login:
// - Guru (sudah login) -> Admin dashboard
// - Anak / tamu       -> KidHome sederhana
function Home() {
  const { isTeacher, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#2D6A76', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
        Memuat...
      </div>
    );
  }
  return isTeacher ? <Admin /> : <KidHome />;
}

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <TopNav />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/quiz/:chapterId" element={<Quiz />} />
            <Route
              path="/chapter/:chapterId"
              element={
                <ProtectedRoute>
                  <ChapterDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}

export default App;
