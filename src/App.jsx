import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Lessons from './pages/Lessons';
import Scores from './pages/Scores';
import ChapterDetail from './pages/ChapterDetail';
import Quiz from './pages/Quiz';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <TopNav />
        <main>
          <Routes>
            {/* Login adalah satu-satunya halaman publik */}
            <Route path="/login" element={<Login />} />

            {/* Semua halaman lain butuh login */}
            <Route path="/" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
            <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
            <Route path="/quiz/:chapterId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/chapter/:chapterId" element={<ProtectedRoute><ChapterDetail /></ProtectedRoute>} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}

export default App;
