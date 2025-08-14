import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../context/UserContext'

// Resolve API base URL from env/window with a safe fallback
const resolveApiBase = () => {
  const env = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || null;
  const win = (typeof window !== 'undefined' && window.__API_BASE__) || null;
  const fallback = 'https://refactored-cod-v6ww469vp657fwqpw-8000.app.github.dev';
  const base = (env || win || fallback).replace(/\/+$/, '');
  return /^https?:\/\//.test(base) ? base : fallback;
};

const API_BASE = resolveApiBase();
const api = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`;

const Profile = () => {
  const { user } = useContext(UserContext)
  // Reliably determine Telegram ID and username
  const tgId = (window?.Telegram?.WebApp?.initDataUnsafe?.user?.id) ?? user?.tg_id ?? user?.id ?? null;
  const username = user?.username ?? window?.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? '';
  const [completedStocks, setCompletedStocks] = useState(null)
  const [freeHookahs, setFreeHookahs] = useState(0)
  const [newAdminId, setNewAdminId] = useState('')

  const handleGrantAdmin = () => {
    if (!newAdminId) return alert('Введите Telegram ID');
    if (!tgId) return alert('ID текущего пользователя не определён');

    fetch(api('/api/grant-admin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: parseInt(newAdminId, 10), grantBy: tgId })
    })
      .then((res) => res.json())
      .then((data) => alert(data.message || 'Права выданы'))
      .catch(() => alert('Ошибка при выдаче прав'))
  };

  useEffect(() => {
    if (!tgId) return; // ждём, пока появится телеграм‑ID

    fetch(api(`/api/main/${tgId}`))
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setCompletedStocks(data?.completedStocks ?? null);
        return fetch(api(`/api/free-hookahs/${tgId}`));
      })
      .then((res) => (res && res.ok ? res.json() : { count: 0 }))
      .then((data) => setFreeHookahs(data?.count ?? 0))
      .catch((err) => {
        console.error('Ошибка при загрузке слотов:', err);
      });
  }, [tgId]);

  if (!user) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка профиля...</p>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Профиль пользователя</h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        <li><strong>ID:</strong> {tgId ?? '—'}</li>
        <li><strong>Имя:</strong> {user.firstName}</li>
        <li><strong>Фамилия:</strong> {user.lastName || '—'}</li>
        <li><strong>Юзернейм:</strong> @{username || '—'}</li>
        <li><strong>Получено кальянов:</strong> {completedStocks ?? '—'}</li>
        <li><strong>Бесплатных кальянов:</strong> {freeHookahs}</li>
        <li><strong>Телефон:</strong> {user.phone || '—'}</li>
      </ul>
      {tgId === 123456789 && (
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