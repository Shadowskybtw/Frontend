import React, { useContext, useEffect, useMemo, useState } from 'react'
import { UserContext } from '../context/UserContext'
import { QRCodeSVG } from 'qrcode.react'
import QrScanner from '../components/QRScanner'
import { userAPI, qrAPI, handleApiError } from '../utils/api'
import styles from '../styles/Promo.module.css'
import Loading from '../components/Loading'

const Promo = () => {
  const { user } = useContext(UserContext)

  // tgId is resolved from Telegram WebApp first, then from our context fallback
  const tgId = useMemo(() => {
    const tId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id
    return tId || user?.tg_id || user?.id || null
  }, [user])

  const [slots, setSlots] = useState([])
  const [freeHookahs, setFreeHookahs] = useState(0)
  const [showScanner, setShowScanner] = useState(false)

  // 🔐 Admins who can confirm visits by scanning a guest QR
  const ADMIN_IDS = [123456789, 987654321] // TODO: replace with real Telegram IDs
  const isAdmin = ADMIN_IDS.includes(Number(tgId))

  // Load current progress + free rewards
  useEffect(() => {
    if (!tgId) return

    const loadUserData = async () => {
      try {
        // 1) Progress (open slots)
        const stocksData = await userAPI.getStocks(tgId);
        const list = Array.isArray(stocksData) ? stocksData : Array.isArray(stocksData?.slots) ? stocksData.slots : [];
        setSlots(list.filter((s) => !s.completed));

        // 2) Number of free hookahs
        const hookahData = await userAPI.getFreeHookahs(tgId);
        setFreeHookahs(Number(hookahData?.count) || 0);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setSlots([]);
        setFreeHookahs(0);
      }
    };

    loadUserData();
  }, [tgId])

  // 🎁 Guest claims a free hookah (only shown when available)
  const handleUseFreeHookah = async () => {
    if (!tgId) return

    try {
      const result = await userAPI.useFreeSlot(tgId);
      if (result?.success) {
        alert('Бесплатный кальян выдан');
        setFreeHookahs((prev) => Math.max(prev - 1, 0));
      } else {
        alert('Нет доступных бесплатных кальянов');
      }
    } catch (error) {
      handleApiError(error, 'Ошибка при выдаче бесплатного кальяна');
    }
  }

  // 📷 Admin scans a guest QR (QR contains backend /redeem/{guest_tg_id})
  const handleScan = async (url) => {
    const adminId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id
    if (!adminId) return alert('Не удалось получить Telegram ID администратора')

    try {
      const result = await qrAPI.redeem(url, adminId);
      alert(result?.message || 'Готово');
      setShowScanner(false);
      
      // После подтверждения перезагрузим прогресс гостя, если этот экран у гостя
      if (tgId) {
        try {
          const stocksData = await userAPI.getStocks(tgId);
          const list = Array.isArray(stocksData) ? stocksData : Array.isArray(stocksData?.slots) ? stocksData.slots : [];
          setSlots(list.filter((s) => !s.completed));
        } catch (error) {
          console.error('Ошибка при обновлении прогресса:', error);
        }
      }
    } catch (error) {
      handleApiError(error, 'Ошибка при подтверждении');
      setShowScanner(false);
    }
  }

  if (!tgId) {
    return <Loading message="Загрузка…" size="medium" />
  }

  // URL в QR для гостя — админ сканирует и подтверждает визит
  const qrUrl = `${process.env.REACT_APP_API_URL || window.__API_BASE__ || 'https://refactored-cod-v6ww469vp657fwqpw-8000.app.github.dev'}/redeem/${tgId}`

  return (
    <div className={styles.promoContainer}>
      <h2 className={styles.promoTitle}>Акция: Выкури 5 кальянов — получи 1 бесплатный</h2>

      {/* Прогресс */}
      <div className={styles.progressSection}>
        <h3 className={styles.progressTitle}>Прогресс</h3>
        <div className={styles.progressBar}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`${styles.progressSlot} ${i < slots.length ? styles.filled : styles.empty}`}
            />
          ))}
        </div>
      </div>

      {/* Кнопка «получить бесплатный» — ТОЛЬКО когда доступен */}
      {freeHookahs > 0 && (
        <div className={styles.freeHookahSection}>
          <p className={styles.freeHookahCount}>Бесплатных кальянов доступно: {freeHookahs}</p>
          <button 
            onClick={handleUseFreeHookah} 
            className={styles.claimButton}
            disabled={freeHookahs === 0}
          >
            Получить бесплатный
          </button>
        </div>
      )}

      {/* QR гостя. Админ сканирует — только так засчитывается слот */}
      <div className={styles.qrSection}>
        <h3 className={styles.qrTitle}>QR‑код для подтверждения кальяна:</h3>
        <div className={styles.qrCode}>
          <QRCodeSVG value={qrUrl} />
        </div>
      </div>

      {/* Доп. блок для администратора: сканирование QR гостя */}
      {isAdmin && (
        <div className={styles.adminSection}>
          <h3 className={styles.adminTitle}>Админская панель</h3>
          <button onClick={() => setShowScanner(true)} className={styles.scanButton}>
            Сканировать QR гостя
          </button>
          {showScanner && (
            <div className={styles.scannerContainer}>
              <QrScanner onScan={handleScan} />
              <button onClick={() => setShowScanner(false)} className={styles.closeButton}>
                Закрыть
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Promo