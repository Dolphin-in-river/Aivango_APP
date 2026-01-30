import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RegisterRequest, VerifyCodeRequest, User } from '../types';
import { API_BASE_URL } from '../config';
import './Registration.css';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();  // from AuthContext

  // Form state
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [code, setCode] = useState<string>('');            // confirmation code input
  const [codeSent, setCodeSent] = useState<boolean>(false); // whether code was sent (to show verification step)
  const [resendSecondsLeft, setResendSecondsLeft] = useState<number>(0);

  const [isRequestingCode, setIsRequestingCode] = useState<boolean>(false);
  const [isResendingCode, setIsResendingCode] = useState<boolean>(false);

  // Notification state
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

  // Handle initial registration form submission
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // Basic validation: all fields must be filled
    if (!email || !firstName || !lastName) {
      setError('Заполните все поля.');
      return;
    }

    try {
      // Prepare request payload with field names matching backend DTO
      setIsRequestingCode(true);
      const payload: RegisterRequest = { email, name: firstName, secondName: lastName };
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        // If email already exists or other server error
        setError('Регистрация не удалась. Этот email уже зарегистрирован.');
      } else {
        // Success: user created and verification code sent to email
        setInfo(`Код подтверждения отправлен на ${email}. Введите его ниже.`);
        setCodeSent(true);
        setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err) {
      setError('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  // Handle code verification form submission
  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!code) {
      setError('Введите код подтверждения.');
      return;
    }
    try {
      const payload: VerifyCodeRequest = { email, code };
      const response = await fetch(`${API_BASE_URL}/auth/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, code: Number(payload.code) })
      });
      if (!response.ok) {
        // Wrong or expired verification code
        setError('Неверный код подтверждения. Попробуйте еще раз.');
        setCode('');  // clear code input for retry
      } else {
        // On success, retrieve the JWT token and log in the user
        const result = await response.json();
        const { accessToken, name, secondName, isOrganizer } = result;

        if (!accessToken) {
          setError('Сервер не вернул токен.');
          return;
        } // expected response: { token: string }
        // Construct user data for context (we have email and name from state)
        const userData: User = {
          email,
          firstName: name,
          lastName: secondName,
          role: isOrganizer ? 'organizer' : 'user',
          isOrganizer: !!isOrganizer,
          token: accessToken
        };
        login(userData);
        navigate('/');  // redirect to homepage (tournaments list) after successful registration
      }
    } catch (err) {
      setError('Ошибка сети. Попробуйте еще раз.');
    }
  };

  // Handle resending verification code (available after a delay)
  const handleResendCode = async () => {
    setError(null);
    setInfo(null);
    try {
      setIsResendingCode(true);
      const response = await fetch(`${API_BASE_URL}/auth/email?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        setError('Не удалось отправить код повторно. Попробуйте позже.');
      } else {
        setInfo(`Новый код отправлен на ${email}.`);
        setCode('');  // clear any previously entered code
        setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err) {
      setError('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsResendingCode(false);
    }
  };

  return (
    <div className="registration-container">
      <h2>Регистрация</h2>
      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      {!codeSent ? (
        /* Initial registration form */
        <form onSubmit={handleRegisterSubmit} className="registration-form">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <label htmlFor="firstName">Имя</label>
          <input 
            type="text" 
            id="firstName" 
            value={firstName} 
            onChange={e => setFirstName(e.target.value)} 
            required 
          />
          <label htmlFor="lastName">Фамилия</label>
          <input 
            type="text" 
            id="lastName" 
            value={lastName} 
            onChange={e => setLastName(e.target.value)} 
            required 
          />
          <button type="submit" disabled={isRequestingCode} aria-busy={isRequestingCode}>
            <span className="btnContent">
              {isRequestingCode && <span className="spinner" aria-hidden="true" />}
              {isRequestingCode ? 'Отправляем код...' : 'Получить код'}
            </span>
          </button>
        </form>
      ) : (
        /* Verification code form (shown after code is sent) */
        <form onSubmit={handleCodeSubmit} className="verification-form">
          <label htmlFor="code">Код подтверждения</label>
          <input 
            type="text" 
            id="code" 
            value={code} 
            onChange={e => setCode(e.target.value)} 
            required 
          />
          <button type="submit">Подтвердить</button>
          <button type="button" onClick={handleResendCode} disabled={!resendEnabled || isResendingCode} aria-busy={isResendingCode}>
            <span className="btnContent">
              {isResendingCode && <span className="spinner" aria-hidden="true" />}
              {isResendingCode
                ? 'Отправляем...'
                : resendEnabled
                  ? 'Отправить код повторно'
                  : `Отправить код повторно (${formatCooldown(resendSecondsLeft)})`}
            </span>
          </button>
        </form>
      )}

      <p className="authHint">
        Уже есть аккаунт? <Link className="authLink" to="/login">Войти</Link>
      </p>
    </div>
  );
};

export default Registration;
