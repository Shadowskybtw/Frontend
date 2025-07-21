import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Promo from './pages/Promo'; // Страница акции
import Profile from './pages/Profile'; // Страница профиля
import NotFound from './pages/NotFound'; // Страница 404
import Navbar from './components/Navbar'; // Навигационная панель

function App() {
  console.log("App component rendered");

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Promo />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
