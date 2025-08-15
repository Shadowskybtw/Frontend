import React from 'react'
import styles from '../styles/Loading.module.css'

const Loading = ({ message = 'Загрузка...', size = 'medium' }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      <p className={styles.message}>{message}</p>
    </div>
  )
}

export default Loading
