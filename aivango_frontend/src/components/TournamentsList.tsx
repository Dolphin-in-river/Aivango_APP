import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getTournaments } from '../api';
import type { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import { isOrganizerRole } from '../utils/roles';
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

const getTournamentVenue = (t: Tournament): string => {
  if (t.finalLocationName) return t.finalLocationName;
  const loc = t.finalLocation ?? t.selectedLocations?.[0] ?? null;
  if (!loc) return 'Локация уточняется';
  return loc.address ? `${loc.name}, ${loc.address}` : loc.name;
};

const getRequirementsStub = (tournamentId: number) => {
  // Заглушка, пока нет API
  return {
    minVictories: 3 + (tournamentId % 7),
    weightCategory: tournamentId % 2 === 0 ? 'Тяжёлый вес' : 'Средний вес',
    minExperience: 1 + (tournamentId % 5),
  };
};

const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;

const TournamentsList: React.FC = () => {
  const { user } = useAuth();
  const token = user?.token ?? '';
  const organizer = isOrganizerRole(user?.role);

  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setState('error');
        return;
      }

      setState('loading');
      try {
        const list = await getTournaments(token);
        if (cancelled) return;
        setTournaments(list);
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const cards = useMemo(() => {
    return tournaments.map((t) => {
      const status = normalizeTournamentStatus(t.tournamentStatus);
      const statusInfo = STATUS_LABELS[status];

      const venue = getTournamentVenue(t);
      const dateISO = getTournamentDateISO(t);
      const dateLabel = formatTournamentDate(dateISO);
      const timeUntil = getTimeUntilStartLabel(dateISO);

      const targetAmount = Number(t.requiredAmount) || 0;
      const collectedAmount = typeof t.collectedAmount === 'number' && !Number.isNaN(t.collectedAmount) ? t.collectedAmount : 0;
      const progress = targetAmount > 0 ? (collectedAmount / targetAmount) * 100 : 0;

      const maxParticipants = typeof t.totalKnights === 'number' && !Number.isNaN(t.totalKnights) ? t.totalKnights : 0;
      const participants = (typeof t.totalKnights === 'number' && typeof t.availableKnightSlots === 'number')
        ? Math.max(0, t.totalKnights - t.availableKnightSlots)
        : 0;

      const totalTickets = typeof t.totalSeats === 'number' && !Number.isNaN(t.totalSeats) ? t.totalSeats : 0;
      const soldTickets = (typeof t.totalSeats === 'number' && typeof t.availableSeats === 'number')
        ? Math.max(0, t.totalSeats - t.availableSeats)
        : 0;

      const requirements = getRequirementsStub(t.id);

      const sponsorGate = canSponsorForTournament(status, progress, targetAmount, collectedAmount);
      const registerGate = canRegisterForTournament(status, dateISO, t.availableKnightSlots ?? null);
      const ticketGate = canBuyTicketForTournament(status, dateISO, t.availableSeats ?? null);

      const role = normalizeTournamentRole(t.userRole);
      const roleMsg = role ? ROLE_LABELS[role] : null;

      // Важно: роль участия в турнире фиксируется. Можно выполнять действия только внутри своей роли.
      // Переходы между ролями запрещены.
      const isKnight = role === 'KNIGHT';
      const isSponsor = role === 'SPONSOR';
      const isSpectator = role === 'SPECTATOR';

      const sponsorDisabled = organizer || (role ? !isSponsor : false) || !sponsorGate.ok;
      const registerDisabled = organizer || (role ? !isKnight : false) || !registerGate.ok || (isKnight && true);
      const ticketDisabled = organizer || (role ? !isSpectator : false) || !ticketGate.ok;

      const sponsorLabel = role && !isSponsor
        ? 'Недоступно'
        : sponsorGate.ok
          ? 'Сбор средств'
          : sponsorGate.reason?.includes('собраны') || progress >= 100
            ? 'Средства собраны'
            : 'Сбор средств закрыт';
      const sponsorTitle = sponsorDisabled ? (roleMsg || sponsorGate.reason || 'Сбор средств недоступен') : '';

      const registerLabel = isKnight
        ? 'Вы уже зарегистрированы'
        : isSponsor
          ? 'Вы спонсор'
          : isSpectator
            ? 'Вы зритель'
            : registerGate.ok
              ? 'Регистрация'
              : registerGate.reason?.includes('Нет свободных')
                ? 'Мест нет'
                : 'Регистрация закрыта';
      const registerTitle = registerDisabled
        ? roleMsg
          ? roleMsg
          : registerGate.reason || 'Регистрация недоступна'
        : '';

      const ticketLabel = isKnight
        ? 'Недоступно'
        : isSponsor
          ? 'Недоступно'
          : isSpectator
            ? ticketGate.ok
              ? 'Купить билет'
              : ticketGate.reason?.includes('Билеты закончились')
                ? 'Билеты закончились'
                : 'Продажа закрыта'
            : ticketGate.ok
              ? 'Купить билет'
              : ticketGate.reason?.includes('Билеты закончились')
                ? 'Билеты закончились'
                : 'Продажа закрыта';
      const ticketTitle = ticketDisabled ? (roleMsg || ticketGate.reason || 'Покупка билетов недоступна') : '';

      const manageLabel = organizer ? 'Управление турниром' : 'Подробнее';

      return {
        t,
        roleMsg,
        statusInfo,
        venue,
        dateLabel,
        timeUntil,
        targetAmount,
        collectedAmount,
        progress,
        participants,
        maxParticipants,
        soldTickets,
        totalTickets,
        requirements,

        sponsorDisabled,
        sponsorLabel,
        sponsorTitle,

        registerDisabled,
        registerLabel,
        registerTitle,

        ticketDisabled,
        ticketLabel,
        ticketTitle,

        manageLabel,
      };
    });
  }, [tournaments, organizer]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Турниры</h1>
            <p className="text-slate-600 mt-1">Список всех турниров и доступных действий</p>
          </div>

          {organizer && (
            <Link
              to="/create-tournament"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-xl leading-none">+</span>
              Создать турнир
            </Link>
          )}
        </div>

        {state === 'loading' && <div className="text-center py-16 text-slate-500">Загрузка турниров...</div>}

        {state === 'error' && (
          <div className="text-center py-16">
            <p className="text-red-500">Не удалось загрузить турниры</p>
          </div>
        )}

        {state === 'ready' && cards.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500">Турниров пока нет</p>
          </div>
        )}

        {state === 'ready' && cards.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <div
                key={c.t.id}
                role="button"
                tabIndex={0}
                aria-label={`Открыть турнир ${c.t.name}`}
                onClick={() => navigate(`/tournaments/${c.t.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/tournaments/${c.t.id}`);
                  }
                }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="h-2 bg-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.min(c.progress, 100)}%` }}
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 line-clamp-2 flex-1">{c.t.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${c.statusInfo.badgeClass}`}>
                      {c.statusInfo.label}
                    </span>
                  </div>

                  <p className="text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                    {c.t.description || 'Описание отсутствует'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-sm">Место: {c.venue}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-sm">Дата: {c.dateLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-sm">Старт: {c.timeUntil}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-sm">Призовой фонд: {money(c.targetAmount)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-green-600">
                      <span className="text-sm">Собрано: {money(c.collectedAmount)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-sm">
                        Участники: {c.participants}/{c.maxParticipants}
                      </span>
                    </div>

                    {c.totalTickets > 0 && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="text-sm">
                          Билеты: {c.soldTickets}/{c.totalTickets}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="text-sm text-slate-600 mb-2">Требования к участникам:</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Побед минимум: {c.requirements.minVictories}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {c.requirements.weightCategory}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        Опыт: {c.requirements.minExperience} года
                      </span>
                    </div>
                  </div>

                  {organizer ? (
                    <Link
                      to={`/tournaments/${c.t.id}/applications`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-3 rounded-lg text-center text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      {c.manageLabel}
                    </Link>
                  ) : (
                    <div className="space-y-3 mt-auto">
                      <div className="grid grid-cols-1 gap-2">
                        <Link
                          to={`/tournaments/sponsor/${c.t.id}`}
                          aria-disabled={c.sponsorDisabled}
                          tabIndex={c.sponsorDisabled ? -1 : 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c.sponsorDisabled) e.preventDefault();
                          }}
                          title={c.sponsorTitle}
                          className={`w-full px-4 py-2 rounded-lg text-center text-white transition-colors ${
                            c.sponsorDisabled ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {c.sponsorLabel}
                        </Link>

                        <Link
                          to={`/tournaments/${c.t.id}/apply`}
                          aria-disabled={c.registerDisabled}
                          tabIndex={c.registerDisabled ? -1 : 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c.registerDisabled) e.preventDefault();
                          }}
                          title={c.registerTitle}
                          className={`w-full px-4 py-2 rounded-lg text-center text-white transition-colors ${
                            c.registerDisabled ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {c.registerLabel}
                        </Link>

                        <Link
                          to={`/tournaments/${c.t.id}/buy-ticket`}
                          aria-disabled={c.ticketDisabled}
                          tabIndex={c.ticketDisabled ? -1 : 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (c.ticketDisabled) e.preventDefault();
                          }}
                          title={c.ticketTitle}
                          className={`w-full px-4 py-2 rounded-lg text-center text-white transition-colors ${
                            c.ticketDisabled ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          {c.ticketLabel}
                        </Link>

                        <Link
                          to={`/tournaments/${c.t.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-2 rounded-lg text-center border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {c.manageLabel}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsList;
