import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../context/UserContext'
import { QRCodeSVG } from 'qrcode.react'
import QrScanner from '../components/QRScanner'

const Promo = () => {
  const { user } = useContext(UserContext)
  const [slots, setSlots] = useState([])
  const [freeHookahs, setFreeHookahs] = useState(0)
  const [showScanner, setShowScanner] = useState(false)

  const isAdmin = [123456789, 987654321].includes(user?.id) // 🔁 Замените на реальные ID

  useEffect(() => {
    if (!user) return

    fetch(`https://zany-potato-q766r7jq7w662xxwp-8000.app.github.dev/api/stocks/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setSlots(data.filter(slot => !slot.completed))
      })

    fetch(`https://zany-potato-q766r7jq7w662xxwp-8000.app.github.dev/api/free-hookahs/${user.id}`)
      .then(res => res.json())
      .then(data => setFreeHookahs(data.count || 0))
  }, [user])

  const handleSmoke = () => {
    fetch(`https://zany-potato-q766r7jq7w662xxwp-8000.app.github.dev/api/stocks/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementSlot: true })
    })
      .then(res => res.json())
      .then(data => {
        setSlots(data.filter(slot => !slot.completed))
        return fetch(`https://zany-potato-q766r7jq7w662xxwp-8000.app.github.dev/api/free-hookahs/${user.id}`)
      })
      .then(res => res.json())
      .then(data => setFreeHookahs(data.count || 0))
  }

  const handleUseFreeHookah = () => {
    fetch(`https://zany-potato-q766r7jq7w662xxwp-8000.app.github.dev/api/use-free-slot/${user.id}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          alert('Бесплатный кальян выдан')
          setFreeHookahs(prev => prev - 1)
        } else {
          alert('Нет доступных бесплатных кальянов')
        }
      })
  }

  const handleScan = (url) => {
    const adminId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    if (!adminId) return alert("Не удалось получить Telegram ID")

    fetch(url, {
      method: 'GET',
      headers: {
        'X-Telegram-ID': adminId.toString()
      }
    })
      .then(res => res.json())
      .then(res => {
        alert(res.message || "Готово")
        setShowScanner(false)
      })
      .catch(() => {
        alert("Ошибка при отправке")
        setShowScanner(false)
      })
  }

  if (!user) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка...</p>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Акция: Выкури 5 кальянов — получи 1 бесплатный</h2>
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: i < slots.length ? '#007bff' : '#ddd'
          }} />
        ))}
      </div>

      <button onClick={handleSmoke}>Выкурил кальян</button>

      <p style={{ marginTop: '1rem' }}>
        Бесплатных кальянов доступно: {freeHookahs}
      </p>

      {freeHookahs > 0 && (
        <button onClick={handleUseFreeHookah}>Забрать бесплатный кальян</button>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>QR-код для подтверждения кальяна:</h3>
        <QRCodeSVG value={`https://zany-potato-q766r7jq7w662xxwp-8000.app.github.dev/redeem/${user.id}`} />
      </div>

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