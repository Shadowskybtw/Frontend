import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

/**
 * Base API URL
 * CRA reads env vars that start with REACT_APP_.
 * If not provided, we fallback to a global/window value, and then to the current hardcoded URL.
 */
const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  'https://refactored-cod-v6ww469vp657fwqpw-8000.app.github.dev';

// Helper to join base + path safely
const api = (p) => `${API_BASE}${p}`;

const Register = () => {
  console.log('Register rendered, API_BASE =', API_BASE);
  const { user, setUser, telegramUser } = useContext(UserContext);
  const [form, setForm] = useState({ name: '', surname: '', phone: '', agree: false });
  const navigate = useNavigate();

  // Если открыто в Telegram — игнорируем старый user из localStorage,
  // чтобы не скрывать форму регистрации уже сохранёнными данными
  useEffect(() => {
    if (!telegramUser?.id && !user) {
      try {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));
      } catch {}
    }
  }, [telegramUser?.id]);

  // Если Telegram user появился — чистим localStorage user,
  // чтобы форма показалась (если телефон ещё не указан)
  useEffect(() => {
    if (telegramUser?.id) {
      try { localStorage.removeItem('user'); } catch {}
      if (user) setUser(null);
    }
  }, [telegramUser?.id]);

  // Если у текущего пользователя уже есть телефон — отправляем на промо
  useEffect(() => {
    const hasPhone = !!(user && user.phone && String(user.phone).trim().length > 0);
    if (hasPhone) navigate('/promo');
  }, [user, navigate]);

  // Префилл из Telegram-профиля (если доступно)
  useEffect(() => {
    if (telegramUser && (!form.name && !form.surname)) {
      const firstName = telegramUser.first_name || telegramUser.name || '';
      const lastName = telegramUser.last_name || telegramUser.surname || '';
      setForm((prev) => ({ ...prev, name: prev.name || firstName, surname: prev.surname || lastName }));
    }
  }, [telegramUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.agree) {
      alert('Вы должны согласиться с правилами и политикой конфиденциальности');
      return;
    }

    // Надёжно приводим Telegram ID к числу
    const tgIdNum = Number(telegramUser?.id);
    if (!Number.isFinite(tgIdNum) || tgIdNum <= 0) {
      alert('Telegram ID не определён. Пожалуйста, откройте WebApp внутри Telegram.');
      return;
    }

    try {
      const res = await fetch(api('/api/register')), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.name,
          lastName: form.surname,
          phone: form.phone,
          tg_id: tgIdNum,
          username: telegramUser?.username || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ошибка регистрации: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log('Ответ от сервера /api/register:', data);

      if (data.success && data.user) {
        try { localStorage.setItem('user', JSON.stringify(data.user)); } catch {}
        setUser(data.user);
        navigate('/promo');
      } else {
        alert('Ошибка регистрации: ' + (data.message || 'неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      alert('Ошибка при отправке формы. Подробнее в консоли.');
    }
  };

  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '5rem 1rem 2rem',
        minHeight: '100vh',
        backgroundColor: 'var(--tg-theme-bg-color, #f4f4f4)',
        color: 'var(--tg-theme-text-color, #111111)',
      }}
    >
      <div>
        <h1 style={{ color: 'var(--tg-theme-text-color, #111111)' }}>Регистрация</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            color: 'var(--tg-theme-text-color, #111111)',
            border: '1px solid var(--tg-theme-hint-color, #d0d7de)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              name="name"
              placeholder="Имя"
              value={form.name}
              onChange={handleChange}
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                width: '100%',
                borderRadius: '8px',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)',
                color: 'var(--tg-theme-text-color, #111111)',
                border: '1px solid var(--tg-theme-hint-color, #ccc)'
              }}
              required
            />
            <input
              type="text"
              name="surname"
              placeholder="Фамилия"
              value={form.surname}
              onChange={handleChange}
              style={{
                padding: '0.75rem',
                fontSize: '1rem',
                width: '100%',
                borderRadius: '8px',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)',
                color: 'var(--tg-theme-text-color, #111111)',
                border: '1px solid var(--tg-theme-hint-color, #ccc)'
              }}
              required
            />
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Телефон"
            value={form.phone}
            onChange={handleChange}
            style={{
              padding: '0.75rem',
              fontSize: '1rem',
              width: '100%',
              borderRadius: '8px',
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)',
              color: 'var(--tg-theme-text-color, #111111)',
              border: '1px solid var(--tg-theme-hint-color, #ccc)'
            }}
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} required />
            <span>
              Я согласен с <a href="/rules">правилами</a> и <a href="/privacy">политикой конфиденциальности</a>
            </span>
          </label>
          <button
            type="submit"
            style={{
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: hover ? '#0056b3' : 'var(--tg-theme-button-color, #007bff)',
              color: 'var(--tg-theme-button-text-color, #ffffff)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
