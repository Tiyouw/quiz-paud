import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import BottomNav from './components/BottomNav';
import Admin from './pages/Admin'; 
import Lessons from './pages/Lessons';
import Scores from './pages/Scores';
import ChapterDetail from './pages/ChapterDetail';
import Quiz from './pages/Quiz';
import './App.css';


function App() {
  return (
    <div className="app-container">
      <TopNav />
      <main>
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/chapter/:chapterId" element={<ChapterDetail />} />
          <Route path="/quiz/:chapterId" element={<Quiz />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;