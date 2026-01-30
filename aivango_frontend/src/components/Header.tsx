import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo3.png';
import './Header.css';

const isOrganizerRole = (role?: string) => {
  if (!role) return false;
  const r = String(role).trim().toLowerCase();
  return r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer';
};

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const isSponsorSection = location.pathname.startsWith('/sponsor');
  const organizer = isOrganizerRole(user?.role);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  return (
    <header className="header header--dark">
      <div className="header__main">
        <div className="brand">
          <Link to={user ? '/tournaments' : '/login'} className="brand-title">
            <img src={logo} alt="Aivango" />
            <div>Aivango</div>
          </Link>
        </div>

        <nav className="nav nav--center">
          {user ? (
            <>
              <Link to="/tournaments">Турниры</Link>

              {organizer && <Link to="/create-tournament">Создать турнир</Link>}

              {/* <Link to="/knights">Рыцари</Link> */}
              {/* <Link to="/sponsor">Спонсорство</Link> */}
              <Link to="/profile">Мой профиль</Link>
            </>
          ) : (
            <>
              <Link to="/login">Вход</Link>
              <Link to="/register">Регистрация</Link>
            </>
          )}
        </nav>

        <div className="header__actions">
          {user && (
            <>
              <div className="userBlock">
                <div className="welcome">Hi, {user.firstName ?? user.email}</div>
                {organizer && <div className="roleUnderWelcome">Роль: Организатор</div>}
              </div>

              <button className="logoutBtn" onClick={handleLogout}>
                Выйти
              </button>
            </>
          )}
        </div>
      </div>

      {isSponsorSection && user && (
        <div className="header__sub">
          <div className="subLinks">
            <Link to="/sponsor/tournaments">Турниры</Link>
            <Link to="/sponsor/knight/tournaments">Турниры для участия</Link>
            <Link to="/sponsor/knight/applications">Мои заявки</Link>

            {organizer && <Link to="/sponsor/organizer/history">История турниров</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
