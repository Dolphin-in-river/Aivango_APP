import type { Tournament } from '../types';
import { safeJsonParse, safeJsonStringify } from './storage';

export type TournamentUiStatus =
  | 'CREATED'
  | 'REGISTRATION'
  | 'TICKET_SALES'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'UNKNOWN';

export type TournamentUiRole = 'SPECTATOR' | 'KNIGHT' | 'SPONSOR' | 'ORGANIZER' | null;

export const normalizeTournamentRole = (raw: string | undefined | null): TournamentUiRole => {
  if (!raw) return null;
  const r = String(raw).trim().toUpperCase();
  if (r === 'SPECTATOR' || r === 'KNIGHT' || r === 'SPONSOR' || r === 'ORGANIZER') return r;
  return null;
};

export const ROLE_LABELS: Record<Exclude<TournamentUiRole, null>, string> = {
  SPECTATOR: 'Вы зарегистрированы как зритель',
  KNIGHT: 'Вы зарегистрированы как рыцарь',
  SPONSOR: 'Вы зарегистрированы как спонсор',
  ORGANIZER: 'Вы организатор',
};

export const STATUS_LABELS: Record<TournamentUiStatus, { label: string; badgeClass: string }> = {
  CREATED: { label: 'Сбор средств', badgeClass: 'bg-orange-100 text-orange-800' },
  REGISTRATION: { label: 'Регистрация', badgeClass: 'bg-blue-100 text-blue-800' },
  TICKET_SALES: { label: 'Продажа билетов', badgeClass: 'bg-purple-100 text-purple-800' },
  IN_PROGRESS: { label: 'В процессе', badgeClass: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Завершен', badgeClass: 'bg-slate-100 text-slate-800' },
  UNKNOWN: { label: 'Неизвестно', badgeClass: 'bg-slate-100 text-slate-800' },
};

const META_KEY = 'aivango-tournament-meta';

export type TournamentMetaMap = Record<string, { dateISO: string }>; // date stub пока нет в API

export const normalizeTournamentStatus = (raw: string | undefined | null): TournamentUiStatus => {
  if (!raw) return 'UNKNOWN';
  const s = String(raw).trim().toUpperCase();

  // Backend enum examples: WAITING_DONATION, KNIGHT_REGISTRATION, TICKET_SALES, ACTIVE, COMPLETED
  if (s.includes('DONATION') || s.includes('WAITING')) return 'CREATED';
  if (s.includes('REG')) return 'REGISTRATION';
  if (s.includes('TICKET') || s.includes('SALE')) return 'TICKET_SALES';
  if (s.includes('PROGRESS') || s.includes('RUN') || s.includes('ACTIVE')) return 'IN_PROGRESS';
  if (s.includes('COMP') || s.includes('DONE') || s.includes('FINISH')) return 'COMPLETED';
  if (s.includes('CREATE') || s.includes('DRAFT')) return 'CREATED';

  // если бэкенд уже возвращает точные значения
  if (s === 'CREATED' || s === 'REGISTRATION' || s === 'TICKET_SALES' || s === 'IN_PROGRESS' || s === 'COMPLETED') {
    return s;
  }

  return 'UNKNOWN';
};

const computeDeterministicDateISO = (tournamentId: number, status: TournamentUiStatus): string => {
  const base = new Date();
  base.setHours(12, 0, 0, 0);

  const shift = (tournamentId % 45) + 3;
  const pastShift = (tournamentId % 60) + 1;

  if (status === 'COMPLETED') base.setDate(base.getDate() - pastShift);
  else if (status === 'IN_PROGRESS') base.setDate(base.getDate());
  else base.setDate(base.getDate() + shift);

  return base.toISOString().slice(0, 10);
};

export const getTournamentDateISO = (tournament: Tournament): string => {
  // Если бэкенд уже возвращает eventDate (LocalDate -> "YYYY-MM-DD"), используем его
  if (tournament.eventDate) {
    const s = String(tournament.eventDate).slice(0, 10);
    // минимальная валидация формата
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }

  const metaMap = safeJsonParse<TournamentMetaMap>(localStorage.getItem(META_KEY), {});
  const key = String(tournament.id);

  if (metaMap[key]?.dateISO) return metaMap[key].dateISO;

  const status = normalizeTournamentStatus(tournament.tournamentStatus);
  const dateISO = computeDeterministicDateISO(tournament.id, status);
  metaMap[key] = { dateISO };
  localStorage.setItem(META_KEY, safeJsonStringify(metaMap));
  return dateISO;
};

export const setTournamentDateISO = (tournamentId: number, dateISO: string): void => {
  const metaMap = safeJsonParse<TournamentMetaMap>(localStorage.getItem(META_KEY), {});
  metaMap[String(tournamentId)] = { dateISO };
  localStorage.setItem(META_KEY, safeJsonStringify(metaMap));
};

export const formatTournamentDate = (dateISO: string): string => {
  const d = new Date(dateISO);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const getTimeUntilStartLabel = (dateISO: string): string => {
  const d = new Date(dateISO);
  const now = new Date();
  const diff = d.getTime() - now.getTime();

  if (diff <= 0) return 'Начался';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `Через ${days} дн.`;
  if (hours > 0) return `Через ${hours} ч.`;
  return 'Скоро начнется';
};

export const getCollectedAmountStub = (tournament: Tournament): number => {
  if (typeof tournament.collectedAmount === 'number' && !Number.isNaN(tournament.collectedAmount)) {
    return tournament.collectedAmount;
  }
  const status = normalizeTournamentStatus(tournament.tournamentStatus);
  if (status !== 'CREATED') return tournament.requiredAmount;

  const seed = (tournament.id % 50) / 100; // 0..0.49
  const ratio = Math.min(0.85, 0.30 + seed);
  return Math.round(tournament.requiredAmount * ratio);
};

export const isInFuture = (dateISO: string): boolean => {
  const d = new Date(dateISO);
  const now = new Date();
  return d.getTime() > now.getTime();
};

export const canRegisterForTournament = (
  status: TournamentUiStatus,
  _dateISO: string,
  availableKnightSlots?: number | null,
): { ok: boolean; reason?: string } => {
  // По требованиям продукта: регистрация рыцарей доступна только на стадии REGISTRATION.
  if (status !== 'REGISTRATION') {
    if (status === 'CREATED') return { ok: false, reason: 'Регистрация еще не началась' };
    if (status === 'TICKET_SALES') return { ok: false, reason: 'Регистрация закрыта' };
    if (status === 'IN_PROGRESS') return { ok: false, reason: 'Турнир уже идет' };
    if (status === 'COMPLETED') return { ok: false, reason: 'Турнир завершен' };
    return { ok: false, reason: 'Регистрация недоступна' };
  }

  // Запрет при отсутствии мест. Если API не дает значение, не блокируем, чтобы не сломать UX.
  if (typeof availableKnightSlots === 'number') {
    if (availableKnightSlots <= 0) return { ok: false, reason: 'Нет свободных мест для рыцарей' };
  }

  return { ok: true };
};

export const canBuyTicketForTournament = (
  status: TournamentUiStatus,
  _dateISO: string,
  availableSeats?: number | null,
): { ok: boolean; reason?: string } => {
  // По требованиям продукта: покупка билета доступна только на стадии TICKET_SALES.
  if (status !== 'TICKET_SALES') {
    if (status === 'CREATED' || status === 'REGISTRATION') return { ok: false, reason: 'Продажа билетов еще не началась' };
    if (status === 'IN_PROGRESS') return { ok: false, reason: 'Турнир уже идет' };
    if (status === 'COMPLETED') return { ok: false, reason: 'Турнир завершен' };
    return { ok: false, reason: 'Продажа билетов не открыта' };
  }

  if (typeof availableSeats === 'number') {
    if (availableSeats <= 0) return { ok: false, reason: 'Билеты закончились' };
  }

  return { ok: true };
};
export const canSponsorForTournament = (
  status: TournamentUiStatus,
  fundingProgressPct: number,
  requiredAmount?: number | null,
  collectedAmount?: number | null,
): { ok: boolean; reason?: string } => {
  // По требованиям продукта: спонсирование доступно только на стадии CREATED (WAITING_DONATION).
  if (status !== 'CREATED') {
    if (status === 'REGISTRATION') return { ok: false, reason: 'Сбор средств завершен' };
    if (status === 'TICKET_SALES') return { ok: false, reason: 'Сбор средств закрыт' };
    if (status === 'IN_PROGRESS') return { ok: false, reason: 'Турнир уже идет' };
    if (status === 'COMPLETED') return { ok: false, reason: 'Турнир завершен' };
    return { ok: false, reason: 'Сбор средств не открыт' };
  }

  // Если у турнира вообще нет цели, то собирать нечего.
  if (typeof requiredAmount === 'number' && requiredAmount <= 0) {
    return { ok: false, reason: 'Сбор средств не требуется' };
  }

  // Нормальная проверка по суммам, если они есть.
  if (typeof requiredAmount === 'number' && typeof collectedAmount === 'number' && requiredAmount > 0) {
    if (collectedAmount >= requiredAmount) return { ok: false, reason: 'Средства уже собраны' };
  }

  if (fundingProgressPct >= 100) return { ok: false, reason: 'Средства уже собраны' };
  return { ok: true };
};

