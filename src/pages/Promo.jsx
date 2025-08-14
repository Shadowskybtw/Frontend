import React, { useContext, useEffect, useMemo, useState } from 'react'
import { UserContext } from '../context/UserContext'
import { QRCodeSVG } from 'qrcode.react'
import QrScanner from '../components/QRScanner'

// Reusable API base (works with Vercel env var or a global injected at build time)
const API_BASE = (process.env.REACT_APP_API_URL || window.__API_BASE__ || '').replace(/\/$/, '')
const api = (path) => `${API_BASE}${path}`

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

    // 1) Progress (open slots)
    fetch(api(`/api/stocks/${tgId}`))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.slots) ? data.slots : []
        setSlots(list.filter((s) => !s.completed))
      })
      .catch(() => setSlots([]))

    // 2) Number of free hookahs
    fetch(api(`/api/free-hookahs/${tgId}`))
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setFreeHookahs(Number(data?.count) || 0))
      .catch(() => setFreeHookahs(0))
  }, [tgId])

  // 🎁 Guest claims a free hookah (only shown when available)
  const handleUseFreeHookah = () => {
    if (!tgId) return

    fetch(api(`/api/use-free-slot/${tgId}`), { method: 'POST' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((result) => {
        if (result?.success) {
          alert('Бесплатный кальян выдан')
          setFreeHookahs((prev) => Math.max(prev - 1, 0))
        } else {
          alert('Нет доступных бесплатных кальянов')
        }
      })
      .catch(() => alert('Ошибка при выдаче бесплатного кальяна'))
  }

  // 📷 Admin scans a guest QR (QR contains backend /redeem/{guest_tg_id})
  const handleScan = (url) => {
    const adminId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id
    if (!adminId) return alert('Не удалось получить Telegram ID администратора')

    fetch(url, {
      method: 'POST', // endpoint should accept POST for state change
      headers: { 'X-Telegram-ID': String(adminId) }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((res) => {
        alert(res?.message || 'Готово')
        setShowScanner(false)
        // После подтверждения перезагрузим прогресс гостя, если этот экран у гостя
        if (tgId) {
          fetch(api(`/api/stocks/${tgId}`))
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
              const list = Array.isArray(data) ? data : Array.isArray(data?.slots) ? data.slots : []
              setSlots(list.filter((s) => !s.completed))
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        alert('Ошибка при подтверждении')
        setShowScanner(false)
      })
  }

  if (!tgId) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка…</p>
  }

  // URL в QR для гостя — админ сканирует и подтверждает визит
  const qrUrl = api(`/redeem/${tgId}`)

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Акция: Выкури 5 кальянов — получи 1 бесплатный</h2>

      {/* Прогресс */}
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: i < slots.length ? '#007bff' : '#ddd'
            }}
          />
        ))}
      </div>

      {/* Кнопка «получить бесплатный» — ТОЛЬКО когда доступен */}
      {freeHookahs > 0 && (
        <button onClick={handleUseFreeHookah}>Получить бесплатный</button>
      )}

      <p style={{ marginTop: '1rem' }}>Бесплатных кальянов доступно: {freeHookahs}</p>

      {/* QR гостя. Админ сканирует — только так засчитывается слот */}
      <div style={{ marginTop: '2rem' }}>
        <h3>QR‑код для подтверждения кальяна:</h3>
        <QRCodeSVG value={qrUrl} />
      </div>

      {/* Доп. блок для администратора: сканирование QR гостя */}
      {isAdmin && (
        <>
          <button onClick={() => setShowScanner(true)}>Сканировать QR гостя</button>
          {showScanner && (
            <div style={{ marginTop: '1rem' }}>
              <QrScanner onScan={handleScan} />
              <button onClick={() => setShowScanner(false)}>Закрыть</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Promo