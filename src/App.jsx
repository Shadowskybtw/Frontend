import React, { useContext, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom';
import { UserProvider, UserContext } from './context/UserContext'

import Navbar from './components/Navbar'
import Profile from './pages/Profile'
import Promo from './pages/Promo'
import NotFound from './pages/NotFound'
import Register from './pages/Register'

function AppRoutes() {
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


function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
