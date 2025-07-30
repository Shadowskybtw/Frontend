import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../context/UserContext'

const Profile = () => {
  const { user } = useContext(UserContext)
  const [completedStocks, setCompletedStocks] = useState(null)
  const [freeHookahs, setFreeHookahs] = useState(0)
  const [newAdminId, setNewAdminId] = useState('')
  const handleGrantAdmin = () => {
    if (!newAdminId) return alert("Введите Telegram ID")
    fetch(`https://bug-free-xylophone-4j664j57qwjgc5gwv-8000.app.github.dev/api/grant-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: parseInt(newAdminId), grantBy: user.id })
    })
      .then(res => res.json())
      .then(data => alert(data.message || "Права выданы"))
      .catch(() => alert("Ошибка при выдаче прав"))
  }

  useEffect(() => {
    if (!user) return

    fetch(`https://bug-free-xylophone-4j664j57qwjgc5gwv-8000.app.github.dev/api/main/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setCompletedStocks(data.completedStocks)
        fetch(`https://bug-free-xylophone-4j664j57qwjgc5gwv-8000.app.github.dev/api/free-hookahs/${user.id}`)
          .then(res => res.json())
          .then(data => setFreeHookahs(data.count || 0))
      })
      .catch(err => {
        console.error('Ошибка при загрузке слотов:', err)
      })
  }, [user])

  if (!user) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка профиля...</p>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Профиль пользователя</h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        <li><strong>ID:</strong> {user.id}</li>
        <li><strong>Имя:</strong> {user.firstName}</li>
        <li><strong>Фамилия:</strong> {user.lastName || '—'}</li>
        <li><strong>Юзернейм:</strong> @{user.username || '—'}</li>
        <li><strong>Получено кальянов:</strong> {completedStocks ?? '—'}</li>
        <li><strong>Бесплатных кальянов:</strong> {freeHookahs}</li>
        <li><strong>Телефон:</strong> {user.phone || '—'}</li>
      </ul>
      {user.id === 123456789 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Выдать админские права</h3>
          <input
            type="number"
            placeholder="Введите TG ID"
            value={newAdminId}
            onChange={(e) => setNewAdminId(e.target.value)}
            style={{ marginRight: '1rem' }}
          />
          <button onClick={handleGrantAdmin}>Выдать права</button>
        </div>
      )}
    </div>
  )
}

export default Profile