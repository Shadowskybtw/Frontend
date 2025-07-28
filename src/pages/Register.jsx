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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4 py-12">
      <div className="w-full max-w-md bg-[#1f1f1f] p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <input
              type="text"
              name="name"
              placeholder="Имя"
              value={form.name}
              onChange={handleChange}
              className="flex-1 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              name="surname"
              placeholder="Фамилия"
              value={form.surname}
              onChange={handleChange}
              className="flex-1 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Телефон"
            value={form.phone}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <label className="flex items-start text-sm text-white space-x-2 leading-tight">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              className="mt-1"
              required
            />
            <span>
              Я согласен с{" "}
              <a href="/rules" className="text-blue-400 underline hover:text-blue-300">правилами</a> и{" "}
              <a href="/privacy" className="text-blue-400 underline hover:text-blue-300">политикой конфиденциальности</a>
            </span>
          </label>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
          >
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
