import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { userAPI, handleApiError } from '../utils/api';
import styles from '../styles/Register.module.css';

const Register = () => {

  const { user, setUser, telegramUser } = useContext(UserContext);
  const [form, setForm] = useState({ name: '', surname: '', phone: '', agree: false });
  const [error409, setError409] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
    if (name === 'phone' && error409) setError409('');
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

    setError409(''); // clear previous conflict

    // Надёжно приводим Telegram ID к числу
    const tgIdNum = Number(telegramUser?.id);
    if (!Number.isFinite(tgIdNum) || tgIdNum <= 0) {
      alert('Telegram ID не определён. Пожалуйста, откройте WebApp внутри Telegram.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tg_id: tgIdNum,
          firstName: (form.name || '').trim(),
          lastName: (form.surname || '').trim(),
          phone: (form.phone || '').trim(),
          username: telegramUser?.username || null,
        }),
      });

      // Специальная обработка конфликта (дубликат телефона/пользователя)
      if (response.status === 409) {
        let msg = 'Этот номер уже используется. Укажите другой номер.';
        try {
          const data = await response.json();
          if (data?.detail) msg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } catch (_) {
          try { msg = await response.text(); } catch (_) {}
        }
        setError409(msg);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          try { localStorage.setItem('user', JSON.stringify(result.user)); } catch {}
          setUser(result.user);
          navigate('/promo');
        } else {
          alert('Ошибка регистрации: ' + (result.message || 'неизвестная ошибка'));
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка при отправке формы. Подробнее в консоли.');
    } finally {
      setSubmitting(false);
    }
  };

    return (
    <div className={styles.registerContainer}>
      <div className={styles.registerContent}>
        <h1 className={styles.registerTitle}>Регистрация</h1>
        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <div className={styles.nameRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Имя</label>
              <input
                type="text"
                name="name"
                placeholder="Введите имя"
                value={form.name}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Фамилия</label>
              <input
                type="text"
                name="surname"
                placeholder="Введите фамилию"
                value={form.surname}
                onChange={handleChange}
                className={styles.formInput}
                required
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Телефон</label>
            <input
              type="tel"
              name="phone"
              placeholder="+7 (999) 123-45-67"
              value={form.phone}
              onChange={handleChange}
              className={`${styles.formInput} ${styles.phoneInput}`}
              pattern="[\+]?[0-9\s\-\(\)]+"
              required
              aria-invalid={!!error409}
              aria-describedby={error409 ? 'phone-error' : undefined}
            />
            {error409 && (
              <div id="phone-error" style={{
                color: 'var(--tg-theme-destructive-text-color, #d93025)',
                fontSize: '0.9rem',
                marginTop: '0.25rem'
              }}>
                {error409}
              </div>
            )}
          </div>
          
          <div className={styles.agreementSection}>
            <input 
              type="checkbox" 
              name="agree" 
              checked={form.agree} 
              onChange={handleChange} 
              className={styles.agreementCheckbox}
              required 
            />
            <span className={styles.agreementText}>
              Я согласен с <a href="/rules" className={styles.agreementLink}>правилами</a> и{' '}
              <a href="/privacy" className={styles.agreementLink}>политикой конфиденциальности</a>
            </span>
          </div>
          
          <button type="submit" className={styles.submitButton} disabled={submitting}>
            {submitting ? 'Отправка…' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
