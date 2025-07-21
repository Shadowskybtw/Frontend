import React from 'react'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  const navStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    padding: '1rem',
    background: '#f3f3f3',
    borderBottom: '1px solid #ccc'
  }

  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? '#007bff' : '#333',
    fontWeight: isActive ? 'bold' : 'normal'
  })

  return (
    <nav style={navStyle}>
      <NavLink to="/" style={linkStyle}>Профиль</NavLink>
      <NavLink to="/promo" style={linkStyle}>Акция</NavLink>
    </nav>
  )
}

export default Navbar