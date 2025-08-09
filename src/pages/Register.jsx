import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

// CRA-only base URL (with optional window fallback). No Vite usage here.
const API_BASE = (
  (typeof process !== 'undefined' && process?.env?.REACT_APP_API_URL) ||
  (typeof window !== 'undefined' && window.__API_URL__) ||
  ''
).toString().trim().replace(/\/$/, '');

const Register = () => {
  console.log('Register rendered, API_BASE =', API_BASE);
  const { user, setUser, telegramUser } = useContext(UserContext);
  const [form, setForm] = useState({ name: '', surname: '', phone: '', agree: false });
  const navigate = useNavigate();

  useEffect(() => {
    // Внутри Telegram не подтягиваем user из localStorage,
    // иначе старая запись может скрыть форму регистрации
    if (!user && !telegramUser?.id) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [telegramUser?.id]);

  useEffect(() => {
    if (telegramUser?.id) {
      try { localStorage.removeItem('user') } catch {}
      if (user) setUser(null)
    }
  }, [telegramUser?.id]);

  useEffect(() => {
    console.log('Текущий пользователь в Register:', user);
    const hasPhone = !!(user && user.phone && String(user.phone).trim().length > 0)
    if (hasPhone) navigate('/promo');
  }, [user, navigate]);

  // Prefill from Telegram profile if available
  useEffect(() => {
    if (telegramUser && (!form.name && !form.surname)) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || telegramUser.name || '',
        surname: prev.surname || telegramUser.surname || '',
      }));
    }
  }, [telegramUser]);

  console.log('Render form:', form);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Helper: join base + path without double slashes
  const api = (path) => `${API_BASE}${path}`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.agree) {
      alert('Вы должны согласиться с правилами и политикой конфиденциальности');
      return;
    }

    console.log('user перед отправкой:', user);
    if (!telegramUser || typeof telegramUser.id !== 'number') {
      alert('Telegram ID не определён. Пожалуйста, откройте WebApp внутри Telegram.');
      return;
    }

    try {
      const res = await fetch(api('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.name,
          lastName: form.surname,
          phone: form.phone,
          tg_id: telegramUser.id,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ошибка регистрации: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log('Ответ от сервера:', data);

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '5rem 1rem 2rem', minHeight: '100vh', backgroundColor: 'var(--tg-theme-bg-color, #f4f4f4)', color: 'var(--tg-theme-text-color, #111111)' }}>
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
              style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', borderRadius: '8px', backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)', color: 'var(--tg-theme-text-color, #111111)', border: '1px solid var(--tg-theme-hint-color, #ccc)' }}
              required
            />
            <input
              type="text"
              name="surname"
              placeholder="Фамилия"
              value={form.surname}
              onChange={handleChange}
              style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', borderRadius: '8px', backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)', color: 'var(--tg-theme-text-color, #111111)', border: '1px solid var(--tg-theme-hint-color, #ccc)' }}
              required
            />
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Телефон"
            value={form.phone}
            onChange={handleChange}
            style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', borderRadius: '8px', backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)', color: 'var(--tg-theme-text-color, #111111)', border: '1px solid var(--tg-theme-hint-color, #ccc)' }}
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              required
            />
            <span>
              Я согласен с{" "}
              <a href="/rules">правилами</a> и{" "}
              <a href="/privacy">политикой конфиденциальности</a>
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
