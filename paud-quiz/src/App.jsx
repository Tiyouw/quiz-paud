import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Admin from './pages/Admin'; 

// Halaman Kuis (untuk murid mengerjakan)
function Quiz() {
  return (
    <div className="app-container">
      <main className="main-content">
        <h2>Halaman Kuis Sedang Dibangun 🛠️</h2>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Sekarang halaman utama (/) langsung menampilkan Dashboard Guru */}
      <Route path="/" element={<Admin />} />
      <Route path="/quiz/:chapterId" element={<Quiz />} />
    </Routes>
  );
}

export default App;