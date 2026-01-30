import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VerifyCodeRequest, User } from '../types';
import { API_BASE_URL } from '../config';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  /* ---------- local state ---------- */
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState<number>(0);

  const [isRequestingCode, setIsRequestingCode] = useState<boolean>(false);
  const [isResendingCode, setIsResendingCode] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const RESEND_COOLDOWN_SECONDS = 60;

  const resendEnabled = useMemo(() => resendSecondsLeft <= 0, [resendSecondsLeft]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setResendSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSecondsLeft]);

  /* ---------- 1-я форма: запрашиваем код ---------- */
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError('Введите email.');
      return;
    }

    try {
      setIsRequestingCode(true);
      const res = await fetch(
        `${API_BASE_URL}/auth/email?email=${encodeURIComponent(email)}`
      );

      if (!res.ok) {
        setError('Аккаунт с таким email не найден. Сначала зарегистрируйтесь.');
        return;
      }

      setInfo(`Код для входа отправлен на ${email}. Введите его ниже.`);
      setCodeSent(true);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  /* ---------- 2-я форма: вводим код ---------- */
  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!code.trim()) {
      setError('Введите код из письма.');
      return;
    }

    try {
      const payload: VerifyCodeRequest = { email, code };
      const res = await fetch(`${API_BASE_URL}/auth/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setError('Неверный или просроченный код. Попробуйте еще раз.');
        setCode('');
        return;
      }

      /* ---- парсим ответ бэкенда ---- */
      const result = await res.json();
      const { accessToken, name, secondName, isOrganizer } = result;

      if (!accessToken) {
        setError('Сервер не вернул токен.');
        return;
      }

      const userData: User = {
        email,
        firstName: name,
        lastName: secondName,
        role: isOrganizer ? 'organizer' : 'user',
        isOrganizer: !!isOrganizer,
        token: accessToken
      };

      login(userData);     // сохраняется и в localStorage (см. AuthContext)
      navigate('/');       // переход на список турниров
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.');
    }
  };

  /* ---------- повторная отправка кода ---------- */
  const handleResendCode = async () => {
    setError(null);
    setInfo(null);
    try {
      setIsResendingCode(true);
      const res = await fetch(
        `${API_BASE_URL}/auth/email?email=${encodeURIComponent(email)}`
      );

      if (!res.ok) {
        setError('Не удалось отправить код повторно. Попробуйте позже.');
        return;
      }

      setInfo(`Новый код отправлен на ${email}.`);
      setCode('');
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsResendingCode(false);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="login-container">
      <h2>Вход</h2>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <form
        onSubmit={codeSent ? handleCodeSubmit : handleLoginSubmit}
        className="login-form"
      >
        {!codeSent ? (
          /*  Шаг 1: ввод email  */
          <>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={isRequestingCode} aria-busy={isRequestingCode}>
              <span className="btnContent">
                {isRequestingCode && <span className="spinner" aria-hidden="true" />}
                {isRequestingCode ? 'Отправляем код...' : 'Получить код'}
              </span>
            </button>
          </>
        ) : (
          /*  Шаг 2: ввод кода  */
          <>
            <label htmlFor="code">Код из письма</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
            <button type="submit">Войти</button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!resendEnabled || isResendingCode}
              aria-busy={isResendingCode}
            >
              <span className="btnContent">
                {isResendingCode && <span className="spinner" aria-hidden="true" />}
                {isResendingCode
                  ? 'Отправляем...'
                  : resendEnabled
                    ? 'Отправить код повторно'
                    : `Отправить код повторно (${formatCooldown(resendSecondsLeft)})`}
              </span>
            </button>
          </>
        )}
      </form>

      <p className="authHint">
        Нет аккаунта? <Link className="authLink" to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
};

export default Login;
