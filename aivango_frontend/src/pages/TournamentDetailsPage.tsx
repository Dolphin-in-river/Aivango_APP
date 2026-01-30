import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import sponsorLogoFallback from '../assets/logo3.png';
import { getApplications, getTournamentBracket, getTournamentRoster, getTournaments } from '../api';
import type {
  ApplicationDTO,
  FightMatchDTO,
  Tournament,
  TournamentBracketDTO,
  TournamentParticipantDTO,
  TournamentSpectatorDTO,
  TournamentSponsorDTO,
} from '../types';
import {
  canBuyTicketForTournament,
  canRegisterForTournament,
  canSponsorForTournament,
  formatTournamentDate,
  getTimeUntilStartLabel,
  getTournamentDateISO,
  normalizeTournamentStatus,
  normalizeTournamentRole,
  ROLE_LABELS,
  STATUS_LABELS,
} from '../utils/tournamentUi';

const formatMoney = (n: number): string =>
  Math.round(n).toLocaleString('ru-RU');

const getRoleBadgeLabel = (role?: string | null): string | null => {
  if (!role) return null;
  const r = String(role).trim().toUpperCase();
  if (r === 'KNIGHT') return 'Вы рыцарь';
  if (r === 'SPONSOR') return 'Вы спонсор';
  if (r === 'SPECTATOR') return 'Вы зритель';
  if (r === 'ORGANIZER') return 'Вы организатор';
  return r;
};

const groupMatchesByRound = (matches: FightMatchDTO[]): Array<{ round: string; name: string; items: FightMatchDTO[] }> => {
  const m = new Map<string, { round: string; name: string; items: FightMatchDTO[] }>();
  for (const it of matches) {
    const key = it.roundDisplayName || it.round || 'ROUND';
    if (!m.has(key)) {
      m.set(key, { round: it.round || key, name: it.roundDisplayName || key, items: [] });
    }
    m.get(key)!.items.push(it);
  }
  return Array.from(m.values());
};

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const user = useContext(AuthContext)?.user ?? null;

  const tournamentId = Number(id);
  const token = user?.token ?? '';

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipantDTO[]>([]);
  const [spectators, setSpectators] = useState<TournamentSpectatorDTO[]>([]);
  const [sponsors, setSponsors] = useState<TournamentSponsorDTO[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [bracket, setBracket] = useState<TournamentBracketDTO | null>(null);
  const [bracketError, setBracketError] = useState<string | null>(null);

  const isOrganizerGlobal = useMemo(() => {
    const role = user?.role;
    if (!role) return false;
    const r = String(role).trim().toLowerCase();
    return r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer';
  }, [user?.role]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token || Number.isNaN(tournamentId)) return;
      try {
        setLoading(true);
        const list = await getTournaments(token);
        const found = list.find((t) => t.id === tournamentId) ?? null;
        if (!alive) return;
        setTournament(found);

        // Дозагружаем списки людей, заявки и сетку параллельно (не критично, если упадет)
        if (found) {
          try {
            const roster = await getTournamentRoster(found.id, token);
            if (alive) {
              setSponsors(roster.sponsors);
              setParticipants(roster.participants);
              setSpectators(roster.spectators);
            }
          } catch (e) {
            if (alive) setRosterError(e instanceof Error ? e.message : 'Не удалось загрузить списки');
          }

          try {
            const apps = await getApplications(found.id, token);
            if (alive) setApplications(apps);
          } catch (e) {
            // fallback: roster already tries to use applications endpoint
          }

          try {
            const b = await getTournamentBracket(found.id, token);
            if (alive) setBracket(b);
          } catch (e) {
            if (alive) setBracketError(e instanceof Error ? e.message : 'Не удалось загрузить турнирную сетку');
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, tournamentId]);

  const ui = useMemo(() => {
    if (!tournament) return null;
    const status = normalizeTournamentStatus(tournament.tournamentStatus);
    const dateISO = getTournamentDateISO(tournament);
    const dateLabel = formatTournamentDate(dateISO);
    const timeUntil = getTimeUntilStartLabel(dateISO);
    const venue = tournament.finalLocationName || tournament.finalLocation?.name || 'Локация уточняется';
    const collected = typeof tournament.collectedAmount === 'number' && !Number.isNaN(tournament.collectedAmount)
      ? tournament.collectedAmount
      : 0;
    const required = typeof tournament.requiredAmount === 'number' && !Number.isNaN(tournament.requiredAmount)
      ? tournament.requiredAmount
      : 0;
    const fundingProgressPct = required > 0 ? Math.min(100, (collected / required) * 100) : 0;

    const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.UNKNOWN;

    const role = normalizeTournamentRole(tournament.userRole);
    const roleBadgeLabel = role ? getRoleBadgeLabel(role) : null;
    const roleMessage = role ? ROLE_LABELS[role] : null;

    const sponsorGate = canSponsorForTournament(status, fundingProgressPct, required, collected);
    const registerGate = canRegisterForTournament(status, dateISO, tournament.availableKnightSlots ?? null);
    const ticketGate = canBuyTicketForTournament(status, dateISO, tournament.availableSeats ?? null);

    return {
      status,
      statusInfo,
      dateISO,
      dateLabel,
      timeUntil,
      venue,
      collected,
      required,
      fundingProgressPct,
      role,
      roleBadgeLabel,
      roleMessage,
      sponsorGate,
      registerGate,
      ticketGate,
    };
  }, [tournament]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-slate-700">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!tournament || !ui || Number.isNaN(tournamentId)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-slate-700">Турнир не найден</p>
            <button
              className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              onClick={() => nav('/tournaments')}
            >
              К списку турниров
            </button>
          </div>
        </div>
      </div>
    );
  }

  const organizer = isOrganizerGlobal || ui.role === 'ORGANIZER';

  const isKnight = ui.role === 'KNIGHT';
  const isSponsor = ui.role === 'SPONSOR';
  const isSpectator = ui.role === 'SPECTATOR';

  const canOpenAudienceVote = ui.status === 'IN_PROGRESS' && isSpectator;
  const audienceVoteTitle = !canOpenAudienceVote
    ? ui.status !== 'IN_PROGRESS'
      ? 'Голосование доступно только во время активного турнира'
      : 'Голосование доступно только зрителям с подтвержденным билетом'
    : '';

  // Важно: роль участия в турнире фиксируется. Можно выполнять действия только внутри своей роли.
  // Переходы между ролями запрещены.
  const sponsorDisabled = organizer || (ui.role ? !isSponsor : false) || !ui.sponsorGate.ok;
  const sponsorTitle = sponsorDisabled
    ? organizer
      ? 'Организатор не может спонсировать'
      : ui.role && !isSponsor
        ? ui.roleMessage || 'Вы уже участвуете в турнире'
        : ui.sponsorGate.reason || ''
    : '';

  const registerDisabled = organizer || (ui.role ? !isKnight : false) || !ui.registerGate.ok || isKnight;
  const registerTitle = registerDisabled
    ? organizer
      ? 'Организатор не может подавать заявку'
      : isKnight
        ? ui.roleMessage || 'Вы уже зарегистрированы'
        : ui.role && !isKnight
          ? ui.roleMessage || 'Вы уже участвуете в турнире'
          : ui.registerGate.reason || ''
    : '';

  const ticketDisabled = organizer || (ui.role ? !isSpectator : false) || !ui.ticketGate.ok;
  const ticketTitle = ticketDisabled
    ? organizer
      ? 'Организатор не может покупать билеты'
      : ui.role && !isSpectator
        ? ui.roleMessage || 'Вы уже участвуете в турнире'
        : ui.ticketGate.reason || ''
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => nav('/tournaments')} className="text-slate-600 hover:text-slate-900 mb-6 transition-colors">
          Назад к списку турниров
        </button>

        {/* Шапка турнира (по верстке из Sponsor Contribution Process) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-2xl font-semibold">{tournament.name}</h1>
                <span className={`px-4 py-2 rounded-full text-base ${ui.statusInfo.badgeClass}`.trim()}>
                  {ui.statusInfo.label}
                </span>
                {ui.roleBadgeLabel && (
                  <span className="px-4 py-2 rounded-full text-base bg-white text-blue-700">
                    {ui.roleBadgeLabel}
                  </span>
                )}
              </div>

              <p className="text-blue-100 text-lg mb-4">{tournament.description || 'Описание отсутствует'}</p>

              <div className="flex flex-wrap gap-6 mb-4">
                <div className="text-blue-100">{ui.venue}</div>
                <div className="text-blue-100">{ui.dateLabel}</div>
                <div className="text-blue-100">Старт: {ui.timeUntil}</div>
                <div className="text-blue-100">Рыцарей: {typeof tournament.totalKnights === 'number' && typeof tournament.availableKnightSlots === 'number'
                  ? Math.max(0, tournament.totalKnights - tournament.availableKnightSlots)
                  : (participants.length || applications.length)}{typeof tournament.totalKnights === 'number' ? `/${tournament.totalKnights}` : ''}</div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-col gap-2 ml-4">
              {organizer && (
                <Link
                  to={`/tournaments/${tournament.id}/applications`}
                  className="bg-white/15 hover:bg-white/20 px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center"
                >
                  Заявки рыцарей
                </Link>
              )}

              <Link
                to={`/tournaments/sponsor/${tournament.id}`}
                aria-disabled={sponsorDisabled}
                tabIndex={sponsorDisabled ? -1 : 0}
                onClick={(e) => {
                  if (sponsorDisabled) e.preventDefault();
                }}
                title={sponsorDisabled ? sponsorTitle : ''}
                className={
                  sponsorDisabled
                    ? 'bg-amber-600/60 cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                    : 'bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                }
              >
                {ui.role && !isSponsor
                  ? 'Недоступно'
                  : ui.sponsorGate.ok
                    ? 'Сбор средств'
                    : ui.sponsorGate.reason?.includes('собраны') || ui.fundingProgressPct >= 100
                      ? 'Средства собраны'
                      : 'Сбор средств закрыт'}
              </Link>

              <Link
                to={`/tournaments/${tournament.id}/apply`}
                aria-disabled={registerDisabled}
                tabIndex={registerDisabled ? -1 : 0}
                onClick={(e) => {
                  if (registerDisabled) e.preventDefault();
                }}
                title={registerDisabled ? registerTitle : ''}
                className={
                  registerDisabled
                    ? 'bg-green-600/60 cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                    : 'bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                }
              >
                {isKnight
                  ? 'Вы уже зарегистрированы'
                  : isSponsor
                    ? 'Вы спонсор'
                    : isSpectator
                      ? 'Вы зритель'
                      : ui.registerGate.ok
                        ? 'Регистрация'
                        : ui.registerGate.reason?.includes('Нет свободных')
                          ? 'Мест нет'
                          : 'Регистрация закрыта'}
              </Link>

              <Link
                to={`/tournaments/${tournament.id}/buy-ticket`}
                aria-disabled={ticketDisabled}
                tabIndex={ticketDisabled ? -1 : 0}
                onClick={(e) => {
                  if (ticketDisabled) e.preventDefault();
                }}
                title={ticketDisabled ? ticketTitle : ''}
                className={
                  ticketDisabled
                    ? 'bg-purple-600/60 cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                    : 'bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                }
              >
                {ui.role && !isSpectator
                  ? 'Недоступно'
                  : ui.ticketGate.ok
                    ? 'Купить билет'
                    : ui.ticketGate.reason?.includes('Билеты закончились')
                      ? 'Билеты закончились'
                      : 'Продажа закрыта'}
              </Link>

              {ui.status === 'IN_PROGRESS' && (
                <Link
                  to={`/tournaments/${tournament.id}/audience-vote`}
                  aria-disabled={!canOpenAudienceVote}
                  tabIndex={!canOpenAudienceVote ? -1 : 0}
                  onClick={(e) => {
                    if (!canOpenAudienceVote) e.preventDefault();
                  }}
                  title={!canOpenAudienceVote ? audienceVoteTitle : ''}
                  className={
                    !canOpenAudienceVote
                      ? 'bg-pink-600/60 cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                      : 'bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center'
                  }
                >
                  Приз зрительских симпатий
                </Link>
              )}
            </div>
          </div>

          {/* Прогресс сбора средств */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span>Прогресс сбора средств</span>
              <span>{ui.fundingProgressPct.toFixed(0)}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-3 mb-2">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${Math.min(ui.fundingProgressPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-blue-100">
              <span>Собрано: {formatMoney(ui.collected)} ₽</span>
              <span>Цель: {formatMoney(ui.required)} ₽</span>
            </div>
          </div>
        </div>

        {/* Контент */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">О турнире</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
              <div>
                <div className="text-slate-500 text-sm">Статус</div>
                <div className="font-medium">{tournament.tournamentStatus}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm">Организатор</div>
                <div className="font-medium">{tournament.organizerName || 'Неизвестно'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm">Локация</div>
                <div className="font-medium">{ui.venue}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm">Дата</div>
                <div className="font-medium">{ui.dateLabel}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm">Куплено билетов</div>
                <div className="font-medium">
                  {typeof tournament.totalSeats === 'number' && typeof tournament.availableSeats === 'number'
                    ? Math.max(0, tournament.totalSeats - tournament.availableSeats)
                    : '...'}{' '}из{' '}
                  {typeof tournament.totalSeats === 'number' ? tournament.totalSeats : '...'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-sm">Зарегистрировано рыцарей</div>
                <div className="font-medium">
                  {typeof tournament.totalKnights === 'number' && typeof tournament.availableKnightSlots === 'number'
                    ? Math.max(0, tournament.totalKnights - tournament.availableKnightSlots)
                    : '...'}{' '}из{' '}
                  {typeof tournament.totalKnights === 'number' ? tournament.totalKnights : '...'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Призовой фонд</h2>
            <div className="text-slate-700">
              <p className="mb-2">Процент призового фонда: {tournament.prizePercentNum}%</p>
              <p>
                Оценка призового фонда (от собранных средств):{' '}
                <span className="font-semibold">
                  {formatMoney((ui.collected * (tournament.prizePercentNum || 0)) / 100)} ₽
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Рыцари</h2>
            {rosterError ? (
              <p className="text-slate-500">{rosterError}</p>
            ) : (participants.length === 0 && applications.length === 0) ? (
              <p className="text-slate-500">Пока нет участников</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(participants.length > 0
                  ? participants
                  : applications.map((a) => ({ id: a.id, fullName: a.fullName, createdAt: a.createdAt }))
                ).map((p: any) => (
                  <div key={p.id ?? p.fullName} className="border border-slate-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900">{p.fullName || 'Неизвестно'}</p>
                    {p.status && <p className="text-sm text-slate-600">Статус: {String(p.status)}</p>}
                    {p.createdAt && (
                      <p className="text-sm text-slate-600">Дата: {new Date(p.createdAt).toLocaleString('ru-RU')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Зрители</h2>
            {rosterError ? (
              <p className="text-slate-500">{rosterError}</p>
            ) : spectators.length === 0 ? (
              <p className="text-slate-500">Пока нет зрителей</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {spectators.map((s) => (
                  <div key={s.id ?? s.fullName ?? Math.random()} className="border border-slate-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900">{s.fullName || 'Неизвестно'}</p>
                    {typeof s.seatsCount === 'number' && (
                      <p className="text-sm text-slate-600">Мест: {s.seatsCount}</p>
                    )}
                    {s.createdAt && (
                      <p className="text-sm text-slate-600">Дата: {new Date(s.createdAt).toLocaleString('ru-RU')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Турнирная сетка</h2>
            {bracket ? (
              <div className="space-y-6">
                {groupMatchesByRound(bracket.matches || []).map((g) => (
                  <div key={g.name}>
                    <h3 className="text-slate-700 font-semibold mb-3">{g.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {g.items.map((m) => (
                        <div key={m.matchId} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="text-slate-900">{m.fighter1Name || 'TBD'} vs {m.fighter2Name || 'TBD'}</p>
                              {m.fightDate && (
                                <p className="text-sm text-slate-600">{new Date(m.fightDate).toLocaleString('ru-RU')}</p>
                              )}
                              {m.comment && <p className="text-sm text-slate-500">{m.comment}</p>}
                            </div>
                            {m.winnerName && (
                              <div className="text-sm text-slate-700">
                                Победитель: <span className="font-semibold">{m.winnerName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : bracketError ? (
              <p className="text-slate-500">{bracketError}</p>
            ) : (
              <p className="text-slate-500">Сетка еще не создана</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Наши спонсоры</h2>
            {rosterError ? (
              <p className="text-slate-500">{rosterError}</p>
            ) : sponsors.length === 0 ? (
              <p className="text-slate-500">Пока нет спонсоров</p>
            ) : (
              <SponsorsGrid sponsors={sponsors} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SponsorsGrid = ({ sponsors }: { sponsors: TournamentSponsorDTO[] }) => {
  const byPkg = (pkg: string) => sponsors.filter((s) => String(s.packageType ?? '').toUpperCase() === pkg);
  const platinum = byPkg('PLATINUM');
  const gold = byPkg('GOLD');
  const silver = byPkg('SILVER');
  const bronze = byPkg('BRONZE');

  const renderLogo = (s: TournamentSponsorDTO, size: 'small' | 'medium' | 'large' | 'xlarge') => {
    const cls =
      size === 'xlarge'
        ? 'w-64 h-64'
        : size === 'large'
          ? 'w-48 h-48'
          : size === 'medium'
            ? 'w-32 h-32'
            : 'w-20 h-20';
    const raw = (s.logoPath || '').trim();
    const src = raw
      ? (raw.startsWith('http://') || raw.startsWith('https://') ? raw : `http://localhost:8081${raw.startsWith('/') ? '' : '/'}${raw}`)
      : '';

    if (!src) return <img src={sponsorLogoFallback} alt="Sponsor" className={`${cls} object-contain mx-auto`} />;

    return <img src={src} alt={String(s.companyName ?? 'Sponsor')} className={`${cls} object-contain mx-auto`} />;
  };

  const renderSection = (
    title: string,
    wrapperClass: string,
    items: TournamentSponsorDTO[],
    size: 'small' | 'medium' | 'large' | 'xlarge',
  ) => {
    if (items.length === 0) return null;
    return (
      <div className={wrapperClass}>
        <h3 className="mb-6 text-xl">{title}</h3>
        <div className="flex flex-wrap justify-center gap-6">
          {items.map((s) => (
            <div key={s.id ?? `${s.companyName}-${s.amount}`} className="text-center">
              <div className="bg-white p-4 rounded-xl shadow-md mb-2 hover:shadow-lg transition-shadow">
                {renderLogo(s, size)}
              </div>
              <p className="text-sm text-slate-700 font-medium">{s.companyName || 'Спонсор'}</p>
              {typeof s.amount === 'number' && (
                <p className="text-xs text-slate-600">{Math.round(s.amount).toLocaleString('ru-RU')} ₽</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderSection(
        'Platinum - Королевские меценаты',
        'bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200',
        platinum,
        'xlarge',
      )}
      {renderSection(
        'Gold - Знатные покровители',
        'bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200',
        gold,
        'large',
      )}
      {renderSection(
        'Silver - Благородные союзники',
        'bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-200',
        silver,
        'medium',
      )}
      {renderSection(
        'Bronze - Поддержка общины',
        'bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200',
        bronze,
        'small',
      )}
    </div>
  );
};
