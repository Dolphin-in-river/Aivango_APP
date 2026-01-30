import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { getParticipantsByRole, getTournaments, submitAudienceVote } from '../api';
import type { Tournament } from '../types';
import { formatTournamentDate, getTournamentDateISO, normalizeTournamentStatus } from '../utils/tournamentUi';

type PageMode = 'loading' | 'ready' | 'alreadyVoted' | 'noAccess' | 'empty' | 'error';

type UiKnight = {
  id: number;
  fullName: string;
};

const normalizeName = (k: { name?: string | null; secondName?: string | null }): string => {
  const n = String(k.name ?? '').trim();
  const s = String(k.secondName ?? '').trim();
  const joined = `${n} ${s}`.trim();
  return joined || 'Неизвестно';
};

const voteStorageKey = (email: string, tournamentId: number) => `aivango-vote:${String(email || '').toLowerCase()}:${tournamentId}`;

const readStoredVote = (email: string, tournamentId: number): number | null => {
  try {
    const raw = localStorage.getItem(voteStorageKey(email, tournamentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { votedForId?: number };
    return typeof parsed?.votedForId === 'number' ? parsed.votedForId : null;
  } catch {
    return null;
  }
};

const writeStoredVote = (email: string, tournamentId: number, votedForId: number) => {
  try {
    localStorage.setItem(voteStorageKey(email, tournamentId), JSON.stringify({ votedForId, ts: Date.now() }));
  } catch {
    // ignore
  }
};

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z',
  checkCircle: 'M9 12l2 2 4-4 M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20z',
  alertCircle: 'M12 9v4 M12 17h.01 M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20z',
  trophy: 'M8 21h8 M12 17v4 M7 4h10v3a5 5 0 0 1-10 0V4z M5 4h2v2a4 4 0 0 1-2-2z M19 4h-2v2a4 4 0 0 0 2-2z',
  calendar: 'M8 2v2 M16 2v2 M3 7h18 M5 5h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  mapPin: 'M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
};

export default function AudienceVotingPage() {
  const { id } = useParams();
  const tournamentId = Number(id);
  const nav = useNavigate();

  const user = useContext(AuthContext)?.user ?? null;
  const token = user?.token ?? '';
  const email = user?.email ?? '';

  const [mode, setMode] = useState<PageMode>('loading');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [knights, setKnights] = useState<UiKnight[]>([]);
  const [selectedKnightId, setSelectedKnightId] = useState<number | null>(null);
  const [votedKnightId, setVotedKnightId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [votingApiIssue, setVotingApiIssue] = useState<string | null>(null);

  const tournamentUi = useMemo(() => {
    if (!tournament) return null;
    const status = normalizeTournamentStatus(tournament.tournamentStatus);
    const dateISO = getTournamentDateISO(tournament);
    const dateLabel = formatTournamentDate(dateISO);
    const city = tournament.finalLocationName || tournament.finalLocation?.name || 'Локация уточняется';
    return { status, dateLabel, city };
  }, [tournament]);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token || Number.isNaN(tournamentId)) {
        if (!alive) return;
        setMode('error');
        setErrorText('Некорректный идентификатор турнира');
        return;
      }
      try {
        setMode('loading');
        setErrorText('');
        setVotingApiIssue(null);

        const storedVote = readStoredVote(email, tournamentId);
        if (alive) setVotedKnightId(storedVote);

        const list = await getTournaments(token);
        const found = list.find((t) => t.id === tournamentId) ?? null;
        if (!alive) return;
        setTournament(found);

        if (!found) {
          setMode('error');
          setErrorText('Турнир не найден');
          return;
        }

        const status = normalizeTournamentStatus(found.tournamentStatus);
        if (status !== 'IN_PROGRESS') {
          setMode('noAccess');
          return;
        }

        // Проверяем доступ: пользователь должен быть зрителем с подтвержденным билетом.
        // В ParticipantDTO для зрителя приходят ticketSeatsCount и bookingCode - этого достаточно,
        // и не требует обращения к /api/votes (который на текущем бэке падает из-за principal).
        let hasConfirmedTicket = false;
        try {
          const spectators = await getParticipantsByRole(found.id, 'SPECTATOR', token);
          const me = spectators.find((s) => String(s.email ?? '').toLowerCase() === String(email).toLowerCase());
          const seats = typeof me?.ticketSeatsCount === 'number' ? me.ticketSeatsCount : 0;
          const code = String(me?.bookingCode ?? '').trim();
          hasConfirmedTicket = !!me && seats > 0 && !!code;
        } catch {
          hasConfirmedTicket = false;
        }

        if (!hasConfirmedTicket) {
          setMode('noAccess');
          return;
        }

        // Список рыцарей (для отрисовки используем ручку по роли KNIGHT)
        const knightsByRole = await getParticipantsByRole(found.id, 'KNIGHT', token);
        const uiKnights: UiKnight[] = knightsByRole
          .filter((k) => typeof k.id === 'number')
          .map((k) => ({
            id: k.id as number,
            fullName: normalizeName(k),
          }));
        if (!alive) return;
        setKnights(uiKnights);

        if (uiKnights.length === 0) {
          setMode('empty');
          return;
        }

        // Раньше тут был "пинг" на /api/tournaments/{id}/knights, чтобы проверить доступность голосования.
        // Но в текущей версии бэка VoteController использует Authentication principal как UserAccount,
        // тогда как JwtAuthFilter кладет в principal email (String). Из-за этого endpoint возвращает 500
        // и страница падала в общий Error.
        //
        // Поэтому теперь страница загружается без этого пинга. Доступ мы проверяем по билету,
        // а факт "уже голосовал" - по локальному сохранению (до фикса бэка это единственный надежный источник).
        if (!alive) return;
        setMode(storedVote ? 'alreadyVoted' : 'ready');
      } catch (e) {
        if (!alive) return;
        setMode('error');
        setErrorText(e instanceof Error ? e.message : 'Не удалось загрузить страницу');
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, tournamentId, email]);

  const onVote = async () => {
    if (!token || !tournament || !selectedKnightId) return;
    try {
      setSubmitting(true);
      await submitAudienceVote(tournament.id, selectedKnightId, token);
      writeStoredVote(email, tournament.id, selectedKnightId);
      setVotedKnightId(selectedKnightId);
      showToast('Голос учтен');
      setMode('alreadyVoted');
    } catch (e: any) {
      const st = typeof e?.status === 'number' ? e.status : null;
      if (st === 400) {
        // На бэке 400 бывает не только при повторном голосовании (например, нет билета или турнир не ACTIVE).
        // Если у нас есть локальная отметка - покажем "уже голосовали", иначе сообщим, что голосование недоступно.
        const storedVote = readStoredVote(email, tournament.id);
        if (storedVote) {
          setVotedKnightId(storedVote);
          setMode('alreadyVoted');
          showToast('Вы уже голосовали');
        } else {
          showToast('Голосование недоступно');
        }
        return;
      }

      // 500 (и другие) - сейчас чаще всего из-за бага в VoteController на бэке.
      // Не валим страницу в Error, а показываем понятное сообщение.
      setVotingApiIssue('Сервис голосования временно недоступен на сервере. Страница загрузилась, но отправка голоса может не работать до фикса бэкенда.');
      showToast('Не удалось отправить голос');
    } finally {
      setSubmitting(false);
    }
  };

  const backToTournament = () => {
    if (Number.isNaN(tournamentId)) return nav('/tournaments');
    nav(`/tournaments/${tournamentId}`);
  };

  if (!user) return null;

  // Loading
  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="h-6 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded w-2/3 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No access
  if (mode === 'noAccess') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon d={ICONS.alertCircle} className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl text-gray-900 mb-4">Нет доступа</h2>
          <p className="text-slate-600 mb-6">
            Голосование доступно только зрителям с подтвержденным билетом во время активного турнира.
          </p>
          <button
            onClick={backToTournament}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Вернуться к турниру
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (mode === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon d={ICONS.alertCircle} className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl text-gray-900 mb-4">Ошибка</h2>
          <p className="text-slate-600 mb-6">{errorText || 'Не удалось загрузить страницу'}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              Повторить
            </button>
            <button
              onClick={backToTournament}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-lg transition-colors"
            >
              Вернуться к турниру
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty
  if (mode === 'empty') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={backToTournament}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <Icon d={ICONS.arrowLeft} className="w-5 h-5" />
            Назад к турниру
          </button>

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon d={ICONS.trophy} className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-2xl text-gray-900 mb-2">Участники не найдены</h2>
            <p className="text-slate-600 mb-6">В этом турнире пока нет участников для голосования.</p>
            <button
              onClick={backToTournament}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Вернуться к турниру
            </button>
          </div>
        </div>
      </div>
    );
  }

  const alreadyVoted = mode === 'alreadyVoted';
  const canVote = mode === 'ready' && !alreadyVoted;

  const selectedOrVotedId = alreadyVoted ? votedKnightId : selectedKnightId;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Icon d={ICONS.checkCircle} className="w-5 h-5" />
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to={`/tournaments/${tournamentId}`}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <Icon d={ICONS.arrowLeft} className="w-5 h-5" />
          Назад к турниру
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-700 text-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl font-bold">Приз зрительских симпатий</h1>
                <span className="px-4 py-2 rounded-full text-base bg-white text-indigo-700">Голосование активно</span>
              </div>

              {tournament && (
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-blue-100">{tournament.name}</h2>
                  <div className="flex flex-wrap gap-4 text-blue-100">
                    <div className="flex items-center gap-2">
                      <Icon d={ICONS.calendar} className="w-4 h-4" />
                      {tournamentUi?.dateLabel || 'Дата уточняется'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon d={ICONS.mapPin} className="w-4 h-4" />
                      {tournamentUi?.city || 'Локация уточняется'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Icon d={ICONS.heart} className="w-8 h-8 text-white" />
            </div>
          </div>

          {alreadyVoted && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Icon d={ICONS.checkCircle} className="w-5 h-5" />
                <span className="font-semibold">Вы уже голосовали</span>
              </div>
              <p className="text-blue-100 mt-1">Спасибо за участие в голосовании</p>
            </div>
          )}
        </div>

        {votingApiIssue && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon d={ICONS.alertCircle} className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="font-semibold">Внимание</div>
                <div className="text-sm mt-1">{votingApiIssue}</div>
              </div>
            </div>
          </div>
        )}

        {/* Info block */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon d={ICONS.heart} className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Как проголосовать</h3>
              <p className="text-slate-600 leading-relaxed">
                Выберите одного участника турнира и проголосуйте за приз зрительских симпатий.
                Голос можно отдать только один раз.
              </p>
            </div>
          </div>
        </div>

        {/* Knights list */}
        <div className="space-y-4 mb-24">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Участники турнира</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knights.map((knight) => {
              const isSelected = selectedOrVotedId === knight.id;
              return (
                <div
                  key={knight.id}
                  className={
                    `bg-white rounded-xl shadow-md p-6 transition-all duration-200 border-2 ` +
                    (alreadyVoted
                      ? isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-transparent opacity-60'
                      : isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-[1.02] cursor-pointer'
                        : 'border-transparent hover:border-blue-200 hover:shadow-lg cursor-pointer')
                  }
                  onClick={() => {
                    if (alreadyVoted) return;
                    setSelectedKnightId(knight.id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white">
                      <span className="text-xl font-bold">{knight.fullName.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{knight.fullName}</h4>
                        <input
                          type="radio"
                          name="selectedKnight"
                          checked={isSelected}
                          onChange={() => {
                            if (alreadyVoted) return;
                            setSelectedKnightId(knight.id);
                          }}
                          disabled={alreadyVoted}
                          className="w-5 h-5 text-blue-600"
                          style={{ accentColor: 'var(--color-blue-600)' }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">Участник</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action block */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:relative md:bg-transparent md:border-0 md:p-0">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={onVote}
              disabled={!canVote || !selectedKnightId || submitting}
              className={
                `w-full md:flex-1 px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ` +
                (!canVote || !selectedKnightId || submitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white')
              }
            >
              <Icon d={ICONS.heart} className="w-5 h-5" />
              {alreadyVoted ? 'Вы уже голосовали' : submitting ? 'Отправка...' : 'Проголосовать'}
            </button>

            <Link
              to={`/tournaments/${tournamentId}`}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Назад к турниру
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
