import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const API_BASE = import.meta.env.REACT_APP_API_URL || '';

const Register = () => {
  console.log('Register rendered');
  const { user, setUser, telegramUser } = useContext(UserContext);
  const [form, setForm] = useState({ name: '', surname: '', phone: '', agree: false });
  const navigate = useNavigate();

useEffect(() => {
  if (!user) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }
}, []);

  useEffect(() => {
    console.log('Текущий пользователь в Register:', user);
    if (user && (user.name || user.first_name)) navigate('/promo');
  }, [user, navigate]);

  console.log('Render form:', form);

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

    console.log("user перед отправкой:", user);
    if (!telegramUser || typeof telegramUser.id !== 'number') {
      alert('Telegram ID не определён. Пожалуйста, откройте WebApp внутри Telegram.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.name,
          lastName: form.surname,
          phone: form.phone,
          tg_id: telegramUser.id
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '5rem 1rem 2rem', minHeight: '100vh', backgroundColor: '#f4f4f4' }}>
      <div>
        <h1>Регистрация</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              name="name"
              placeholder="Имя"
              value={form.name}
              onChange={handleChange}
              style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', border: '1px solid #ccc', borderRadius: '8px' }}
              required
            />
            <input
              type="text"
              name="surname"
              placeholder="Фамилия"
              value={form.surname}
              onChange={handleChange}
              style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', border: '1px solid #ccc', borderRadius: '8px' }}
              required
            />
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Телефон"
            value={form.phone}
            onChange={handleChange}
            style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', border: '1px solid #ccc', borderRadius: '8px' }}
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
              backgroundColor: hover ? '#0056b3' : '#007bff',
              color: '#fff',
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
