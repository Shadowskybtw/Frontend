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
    if (user?.name) navigate('/promo');
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center text-red-500 mb-4">Регистрация</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Имя"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="surname"
          placeholder="Фамилия"
          value={form.surname}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Телефон"
          value={form.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <label className="block text-sm">
          <input
            type="checkbox"
            name="agree"
            checked={form.agree}
            onChange={handleChange}
            className="mr-2"
            required
          />
          Я согласен с <a href="/rules" className="text-blue-500 underline">правилами</a> и <a href="/privacy" className="text-blue-500 underline">политикой конфиденциальности</a>
        </label>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};

export default Register;

