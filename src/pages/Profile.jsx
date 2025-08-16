import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../context/UserContext'
import { userAPI, handleApiError } from '../utils/api'
import styles from '../styles/Profile.module.css'
import Loading from '../components/Loading'
import ApiTester from '../components/ApiTester'
import InitStatus from '../components/InitStatus'

const Profile = () => {
  const { user } = useContext(UserContext)
  // Reliably determine Telegram ID and username
  const tgId = (window?.Telegram?.WebApp?.initDataUnsafe?.user?.id) ?? user?.tg_id ?? user?.id ?? null;
  const username = user?.username ?? window?.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? '';
  const [completedStocks, setCompletedStocks] = useState(null)
  const [freeHookahs, setFreeHookahs] = useState(0)
  const [newAdminId, setNewAdminId] = useState('')

  const handleGrantAdmin = async () => {
    if (!newAdminId) return alert('Введите Telegram ID');
    if (!tgId) return alert('ID текущего пользователя не определён');

    try {
      const result = await userAPI.grantAdmin(parseInt(newAdminId, 10), tgId);
      alert(result.message || 'Права выданы');
      setNewAdminId('');
    } catch (error) {
      handleApiError(error, 'Ошибка при выдаче прав');
    }
  };

  useEffect(() => {
    if (!tgId) return; // ждём, пока появится телеграм‑ID

    const loadUserData = async () => {
      try {
        const userData = await userAPI.checkUser(tgId);
        setCompletedStocks(userData?.completedStocks ?? null);
        
        const hookahData = await userAPI.getFreeHookahs(tgId);
        setFreeHookahs(hookahData?.count ?? 0);
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
      }
    };

    loadUserData();
  }, [tgId]);

  if (!user) {
    return <Loading message="Загрузка профиля..." size="medium" />
  }

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.profileTitle}>Профиль пользователя</h2>
      <ul className={styles.profileList}>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>ID:</span>
          <span className={styles.profileValue}>{tgId ?? '—'}</span>
        </li>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>Имя:</span>
          <span className={styles.profileValue}>{user.firstName}</span>
        </li>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>Фамилия:</span>
          <span className={styles.profileValue}>{user.lastName || '—'}</span>
        </li>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>Юзернейм:</span>
          <span className={styles.profileValue}>@{username || '—'}</span>
        </li>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>Получено кальянов:</span>
          <span className={styles.profileValue}>{completedStocks ?? '—'}</span>
        </li>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>Бесплатных кальянов:</span>
          <span className={styles.profileValue}>{freeHookahs}</span>
        </li>
        <li className={styles.profileItem}>
          <span className={styles.profileLabel}>Телефон:</span>
          <span className={styles.profileValue}>{user.phone || '—'}</span>
        </li>
      </ul>
      {tgId === 123456789 && (
        <div className={styles.adminSection}>
          <h3 className={styles.adminTitle}>Выдать админские права</h3>
          <div className={styles.adminForm}>
            <input
              type="number"
              placeholder="Введите TG ID"
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              className={styles.adminInput}
            />
            <button onClick={handleGrantAdmin} className={styles.adminButton}>
              Выдать права
            </button>
          </div>
        </div>
      )}
      
      {/* API Tester для отладки */}
      <div style={{ marginTop: '2rem' }}>
        <ApiTester telegramId={tgId} />
      </div>
      
      {/* Статус инициализации WebApp */}
      <div style={{ marginTop: '2rem' }}>
        <InitStatus />
      </div>
    </div>
  )
}

export default Profile