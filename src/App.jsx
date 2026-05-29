import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { SchoolProvider } from './contexts/SchoolContext';
import Admin from './pages/Admin';
import Login from './pages/Login';
import SchoolSelect from './pages/SchoolSelect';
import Lessons from './pages/Lessons';
import Scores from './pages/Scores';
import ChapterDetail from './pages/ChapterDetail';
import Quiz from './pages/Quiz';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <div className="app-container">
          <TopNav />
          <main>
            <Routes>
              {/* Halaman publik */}
              <Route path="/login" element={<Login />} />
              <Route path="/select-school" element={<SchoolSelect />} />

              {/* Semua halaman lain butuh login + sekolah */}
              <Route path="/" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
              <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
              <Route path="/quiz/:chapterId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
              <Route path="/chapter/:chapterId" element={<ProtectedRoute><ChapterDetail /></ProtectedRoute>} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </SchoolProvider>
    </AuthProvider>
  );
}

export default App;
