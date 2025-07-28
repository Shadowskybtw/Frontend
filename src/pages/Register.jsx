import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const Register = () => {
  console.log('Register rendered');
  const { user, setUser } = useContext(UserContext);
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
    if (user && user.name) navigate('/promo');
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
    console.log('Форма отправлена:', form);
    if (!form.agree) return alert('Вы должны согласиться с правилами и политикой конфиденциальности');
    try {
      const res = await fetch('https://your-backend.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, telegram_id: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Регистрация прошла', data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        navigate('/promo');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
    }
  };

  const [hover, setHover] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', minHeight: '100vh', backgroundColor: '#f4f4f4' }}>
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
          <div>
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
