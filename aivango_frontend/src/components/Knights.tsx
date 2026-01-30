import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getTournaments } from '../api';
import type { Tournament } from '../types';
import { normalizeTournamentStatus } from '../utils/tournamentUi';

const isOrganizerRole = (role?: string | null) => {
  if (!role) return false;
  const r = String(role).trim().toLowerCase();
  return r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer';
};

const Knights: React.FC = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const token = user?.token ?? '';

  const organizer = isOrganizerRole(user?.role);

  const [all, setAll] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const list = await getTournaments(token);
        if (!alive) return;
        setAll(list);
      } catch (e) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : 'Не удалось загрузить турниры');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const registrationTournaments = useMemo(() => {
    return all.filter((t) => normalizeTournamentStatus(t.tournamentStatus) === 'REGISTRATION');
  }, [all]);

  if (!user) return null;

  if (organizer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <h1 className="text-2xl font-semibold text-slate-900">Рыцари</h1>
            <p className="text-slate-600 mt-2">Страница участия рыцарем недоступна для организатора.</p>
            <Link
              to="/tournaments"
              className="inline-flex mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              К турнирам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Участие рыцарем</h1>
              <p className="text-slate-600 mt-1">Выберите турнир и перейдите к форме заявки.</p>
            </div>
            <button
              onClick={() => nav('/tournaments')}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            >
              Открыть список турниров
            </button>
          </div>

          {err && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{err}</div>
          )}

          {loading ? (
            <div className="mt-6 text-slate-700">Загрузка...</div>
          ) : registrationTournaments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              Сейчас нет турниров в статусе регистрации рыцарей.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrationTournaments.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="text-lg font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-600 mt-1">Локация: {t.finalLocationName || 'Уточняется'}</div>
                  <div className="text-sm text-slate-600">Дата: {t.eventDate || 'Уточняется'}</div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/tournaments/${t.id}`}
                      className="flex-1 text-center px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                    >
                      Открыть турнир
                    </Link>
                    <Link
                      to={`/tournaments/${t.id}/apply`}
                      className="flex-1 text-center px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                      Подать заявку
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Knights;
