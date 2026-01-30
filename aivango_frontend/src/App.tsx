import { useContext } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AuthContext } from './context/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import Registration from './components/Registration';
import TournamentsList from './components/TournamentsList';
import CreateTournament from './components/CreateTournament';
import Knights from './components/Knights';
import MyProfile from './components/MyProfile';
import TournamentDetailsPage from './pages/TournamentDetailsPage';
import TournamentApplicationPage from './pages/TournamentApplicationPage';
import BuyTicketPage from './pages/BuyTicketPage';
import TournamentSponsorPackagesPage from './pages/TournamentSponsorPackagesPage';
import TournamentSponsorFormPage from './pages/TournamentSponsorFormPage';
import AudienceVotingPage from './pages/AudienceVotingPage';
import TournamentManagementPage from './pages/TournamentManagementPage';

import SponsorLayout from './sponsor/SponsorLayout';
import SponsorIndexRedirect from './sponsor/SponsorIndexRedirect';
import RequireSponsorRole from './sponsor/RequireSponsorRole';
import SponsorTournamentsListPage from './sponsor/pages/SponsorTournamentsListPage';
import SponsorPackageSelectionPage from './sponsor/pages/SponsorPackageSelectionPage';
import SponsorFormPage from './sponsor/pages/SponsorFormPage';
import SponsorTournamentPage from './sponsor/pages/SponsorTournamentPage';
import SponsorConfirmationPage from './sponsor/pages/SponsorConfirmationPage';
import SponsorKnightTournamentsPage from './sponsor/pages/SponsorKnightTournamentsPage';
import SponsorKnightApplicationPage from './sponsor/pages/SponsorKnightApplicationPage';
import SponsorMyApplicationsPage from './sponsor/pages/SponsorMyApplicationsPage';
import SponsorTournamentHistoryPage from './sponsor/pages/SponsorTournamentHistoryPage';
import SponsorOrganizerReportsPage from './sponsor/pages/SponsorOrganizerReportsPage';

const App: React.FC = () => {
  const user = useContext(AuthContext)?.user ?? null;

  // Гард: если не залогинен, пускает только на /login и /register
  const RequireAuth = () => {
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
  };

  // Гард для гостя: если залогинен, /login и /register больше не открываются
  const RequireGuest = () => {
    if (user) return <Navigate to="/" replace />;
    return <Outlet />;
  };

  
  const isOrganizerRole = (role?: string) => {
    if (!role) return false;
    const r = String(role).trim().toLowerCase();
    return r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer';
  };

  // Гард для организатора: закрывает организаторские страницы от обычного пользователя
  const RequireOrganizer = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (!isOrganizerRole(user.role)) return <Navigate to="/tournaments" replace />;
    return <Outlet />;
  };
return (
    <>
      <Header />

      <Routes>
        {/* Доступно только без логина */}
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
        </Route>

        {/* Все остальное только после логина */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<TournamentsList />} />
          <Route path="/tournaments" element={<TournamentsList />} />
          <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
          <Route path="/tournaments/:id/audience-vote" element={<AudienceVotingPage />} />
          <Route path="/tournaments/sponsor/:tournamentId" element={<TournamentSponsorPackagesPage />} />
          <Route path="/tournaments/sponsor/:tournamentId/form/:packageType" element={<TournamentSponsorFormPage />} />
          <Route path="/tournaments/:id/apply" element={<TournamentApplicationPage />} />
          <Route path="/tournaments/:id/buy-ticket" element={<BuyTicketPage />} />
          <Route element={<RequireOrganizer />}>
            <Route path="/create-tournament" element={<CreateTournament />} />
            <Route path="/tournaments/:id/applications" element={<TournamentManagementPage />} />
          </Route>
          <Route path="/knights" element={<Knights />} />

          <Route path="/profile" element={<MyProfile />} />

          <Route path="/sponsor" element={<SponsorLayout />}>
            <Route index element={<SponsorIndexRedirect />} />

            <Route
              path="tournaments"
              element={
                <RequireSponsorRole allow={['SPECTATOR','SPONSOR','ORGANIZER']}>
                  <SponsorTournamentsListPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="tournaments/:tournamentId"
              element={
                <RequireSponsorRole allow={['SPECTATOR','SPONSOR','ORGANIZER']}>
                  <SponsorTournamentPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="tournaments/:tournamentId/packages"
              element={
                <RequireSponsorRole allow={['SPECTATOR','SPONSOR','ORGANIZER']}>
                  <SponsorPackageSelectionPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="tournaments/:tournamentId/sponsor-form/:packageType"
              element={
                <RequireSponsorRole allow={['SPECTATOR','SPONSOR','ORGANIZER']}>
                  <SponsorFormPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="confirmation/:sponsorshipId"
              element={
                <RequireSponsorRole allow={['SPECTATOR','SPONSOR','ORGANIZER']}>
                  <SponsorConfirmationPage />
                </RequireSponsorRole>
              }
            />

            <Route
              path="knight/tournaments"
              element={
                <RequireSponsorRole allow={['SPECTATOR','KNIGHT','ORGANIZER']}>
                  <SponsorKnightTournamentsPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="knight/tournaments/:tournamentId/apply"
              element={
                <RequireSponsorRole allow={['SPECTATOR','KNIGHT','ORGANIZER']}>
                  <SponsorKnightApplicationPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="knight/applications"
              element={
                <RequireSponsorRole allow={['SPECTATOR','KNIGHT','ORGANIZER']}>
                  <SponsorMyApplicationsPage />
                </RequireSponsorRole>
              }
            />

            <Route
              path="organizer/history"
              element={
                <RequireSponsorRole allow="ORGANIZER">
                  <SponsorTournamentHistoryPage />
                </RequireSponsorRole>
              }
            />
            <Route
              path="organizer/reports/:tournamentId"
              element={
                <RequireSponsorRole allow="ORGANIZER">
                  <SponsorOrganizerReportsPage />
                </RequireSponsorRole>
              }
            />
          </Route>

          {/* Любой неизвестный приватный маршрут */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Любой неизвестный публичный маршрут */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
