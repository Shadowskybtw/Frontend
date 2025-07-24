import React, { useContext, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { UserProvider, UserContext } from './context/UserContext'

import Navbar from './components/Navbar'
import Profile from './pages/Profile'
import Promo from './pages/Promo'
import NotFound from './pages/NotFound'
import Register from './pages/Register'

function AppRoutes() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Приложение работает</h1>
    </div>
  );
}


function App() {
  const { user } = useContext(UserContext);
  
  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Promo />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
}

export default App;
