import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from '../styles/Navbar.module.css'

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={({ isActive }) => isActive ? styles.navLink + ' ' + styles.active : styles.navLink}>
        Профиль
      </NavLink>
      <NavLink to="/promo" className={({ isActive }) => isActive ? styles.navLink + ' ' + styles.active : styles.navLink}>
        Акция
      </NavLink>
    </nav>
  )
}

export default Navbar