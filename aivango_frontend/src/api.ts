import { API_BASE_URL } from './config';
import {
  AuthTokenResponse,
  TournamentCreateRequest,
  Location,
  Tournament,
  ApplicationDTO, Category, TournamentBracketDTO,
  TournamentRosterDTO,
  TournamentSponsorDTO,
  TournamentParticipantDTO,
  TournamentSpectatorDTO,
  KnightForVotingDTO,
} from './types';

/* ----------------  AUTH  ---------------- */

export const sendCodeToEmail = async (email: string): Promise<void> => {
  const res = await fetch(
    `${API_BASE_URL}/auth/email?email=${encodeURIComponent(email)}`,
  );
  if (!res.ok) throw new Error('Не удалось отправить код. Попробуйте ещё раз.');
};

export const registerUser = async (
  email: string,
  name: string,
  secondName: string,
): Promise<AuthTokenResponse> => {
  const res = await fetch(`${API_BASE_URL}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, secondName }),
  });

  if (res.status === 409)
    throw new Error('Пользователь с такой почтой уже существует');
  if (!res.ok) throw new Error('Ошибка регистрации');
  return res.json();
};

export const verifyCode = async (
  email: string,
  code: string,
): Promise<AuthTokenResponse> => {
  const res = await fetch(`${API_BASE_URL}/auth/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: Number(code) }),
  });
  if (res.status === 400) throw new Error('Неверный код подтверждения');
  if (!res.ok) throw new Error('Ошибка авторизации');
  return res.json();
};

/* ---------------  DATA  ----------------- */

export const fetchLocations = async (token: string): Promise<Location[]> => {
  const res = await fetch(`${API_BASE_URL}/api/location`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Не удалось загрузить локации');
  return res.json();
};

export const fetchCategories = async (token: string): Promise<Category[]> => {
  const res = await fetch(`${API_BASE_URL}/api/category`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Не удалось загрузить категории турниров');
  return res.json();
};

export const createTournament = async (
  token: string,
  dto: TournamentCreateRequest,
): Promise<Tournament> => {
  const res = await fetch(`${API_BASE_URL}/api/tournament`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Не удалось создать турнир');
  return res.json();
};

export const getTournaments = async (token: string): Promise<Tournament[]> => {
  const res = await fetch(`${API_BASE_URL}/api/tournament/tournaments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Не удалось получить список турниров');
  return res.json();
};


export const bookTicket = async (
  token: string,
  tournamentId: number,
  seatsCount: number,
  agreeToRules: boolean = true,
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/tickets/tournaments/${tournamentId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seatsCount, agreeToRules }),
  });

  if (res.status === 400) {
    throw new Error('Не удалось забронировать билет. Возможно билет уже забронирован или продажа закрыта.');
  }
  if (!res.ok) throw new Error('Ошибка бронирования билета');
};

export const getApplications = async (tournamentId: number, token: string): Promise<ApplicationDTO[]> => {
  const res = await fetch(`${API_BASE_URL}/api/application/tournament/${encodeURIComponent(tournamentId)}`, {
    //method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Не удалось получить список заявок');
  return res.json();
};

export const getTournamentBracket = async (
  tournamentId: number,
  token: string,
): Promise<TournamentBracketDTO> => {
  const res = await fetch(`${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/bracket`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 400 бывает если сетка еще не создана
  if (!res.ok) throw new Error('Не удалось получить турнирную сетку');
  return res.json();
};

/* ---------------  SPONSORSHIP  ----------------- */

export type SponsorshipPackageType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export const createSponsorship = async (
  token: string,
  tournamentId: number,
  payload: {
    packageType: SponsorshipPackageType;
    companyName: string;
  },
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/sponsorship/tournaments/${encodeURIComponent(tournamentId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (res.status === 400) {
    throw new Error('Не удалось оформить спонсорство. Возможно сбор средств закрыт или у вас уже есть роль в этом турнире.');
  }
  if (!res.ok) throw new Error('Ошибка оформления спонсорства');
};

/* ---------------  TOURNAMENT PUBLIC LISTS  ----------------- */

// Backend DTO for GET /api/tournament/{tournamentId}/participants?role=...
type ParticipantByRoleDTO = {
  id?: number | null;
  name?: string | null;
  secondName?: string | null;
  email?: string | null;
  role?: string | null;

  // KNIGHT
  applicationStatus?: string | null;
  applicationComment?: string | null;

  // SPECTATOR
  ticketSeatsCount?: number | null;
  bookingCode?: string | null;

  // SPONSOR
  packageType?: string | null;
  sponsorshipAmount?: number | null;
  companyName?: string | null;
};

export const getParticipantsByRole = async (
  tournamentId: number,
  role: 'KNIGHT' | 'SPECTATOR' | 'SPONSOR' | 'ORGANIZER' | string,
  token: string,
): Promise<ParticipantByRoleDTO[]> => {
  const url = `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/participants?role=${encodeURIComponent(role)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Не удалось получить список участников');
  return res.json();
};

const authHeaders = (token: string): HeadersInit => ({ Authorization: `Bearer ${token}` });

const tryGetJson = async <T>(url: string, token: string): Promise<T | null> => {
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const normalizeFullName = (item: { fullName?: string | null; name?: string | null; secondName?: string | null }): string => {
  if (item.fullName && String(item.fullName).trim()) return String(item.fullName).trim();
  const n = String(item.name ?? '').trim();
  const s = String(item.secondName ?? '').trim();
  const joined = `${n} ${s}`.trim();
  return joined || 'Неизвестно';
};

const normalizeSponsor = (s: TournamentSponsorDTO): TournamentSponsorDTO => {
  const pkg = (s.packageType ?? s.package ?? null) as any;
  const packageType = pkg ? String(pkg).trim().toUpperCase() : null;
  const logoPath = s.logoPath ?? s.logoUrl ?? null;
  return {
    ...s,
    packageType,
    logoPath,
    companyName: s.companyName ?? null,
    amount: typeof s.amount === 'number' ? s.amount : s.amount ?? null,
  };
};

const normalizeParticipants = (arr: TournamentParticipantDTO[]): TournamentParticipantDTO[] =>
  arr.map((p) => ({
    ...p,
    fullName: normalizeFullName(p),
    status: p.status ? String(p.status).trim().toUpperCase() : p.status ?? null,
  }));

const normalizeSpectators = (arr: TournamentSpectatorDTO[]): TournamentSpectatorDTO[] =>
  arr.map((p) => ({
    ...p,
    fullName: normalizeFullName(p),
    seatsCount: typeof p.seatsCount === 'number' ? p.seatsCount : p.seatsCount ?? null,
  }));

export const getTournamentRoster = async (
  tournamentId: number,
  token: string,
): Promise<Required<TournamentRosterDTO>> => {
  // Основной вариант: универсальная ручка по роли
  const byRoleBase = `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/participants`;

  const sponsorsByRole = await tryGetJson<ParticipantByRoleDTO[]>(`${byRoleBase}?role=SPONSOR`, token);
  const knightsByRole = await tryGetJson<ParticipantByRoleDTO[]>(`${byRoleBase}?role=KNIGHT`, token);
  const spectatorsByRole = await tryGetJson<ParticipantByRoleDTO[]>(`${byRoleBase}?role=SPECTATOR`, token);

  if (Array.isArray(sponsorsByRole) || Array.isArray(knightsByRole) || Array.isArray(spectatorsByRole)) {
    const sponsors: TournamentSponsorDTO[] = Array.isArray(sponsorsByRole)
      ? sponsorsByRole.map((p) =>
          normalizeSponsor({
            id: typeof p.id === 'number' ? p.id : undefined,
            companyName: p.companyName ?? normalizeFullName(p),
            amount: typeof p.sponsorshipAmount === 'number' ? p.sponsorshipAmount : null,
            packageType: p.packageType ? String(p.packageType).trim().toUpperCase() : null,
            logoPath: null,
          }),
        )
      : [];

    const participants: TournamentParticipantDTO[] = Array.isArray(knightsByRole)
      ? normalizeParticipants(
          knightsByRole.map((p) => ({
            id: typeof p.id === 'number' ? p.id : undefined,
            name: p.name ?? null,
            secondName: p.secondName ?? null,
            fullName: normalizeFullName(p),
            status: p.applicationStatus ? String(p.applicationStatus) : null,
            createdAt: null,
          })),
        )
      : [];

    const spectators: TournamentSpectatorDTO[] = Array.isArray(spectatorsByRole)
      ? normalizeSpectators(
          spectatorsByRole.map((p) => ({
            id: typeof p.id === 'number' ? p.id : undefined,
            name: p.name ?? null,
            secondName: p.secondName ?? null,
            fullName: normalizeFullName(p),
            seatsCount: typeof p.ticketSeatsCount === 'number' ? p.ticketSeatsCount : null,
            createdAt: null,
          })),
        )
      : [];

    return { sponsors, participants, spectators };
  }

  // 1) Unified endpoint (если на бэке сделана одна ручка)
  const unifiedCandidates = [
    `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/roster`,
    `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/members`,
    `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/people`,
  ];

  for (const url of unifiedCandidates) {
    const data = await tryGetJson<TournamentRosterDTO>(url, token);
    if (data && (data.sponsors || data.participants || data.spectators)) {
      const sponsors = Array.isArray(data.sponsors) ? data.sponsors.map(normalizeSponsor) : [];
      const participants = Array.isArray(data.participants) ? normalizeParticipants(data.participants) : [];
      const spectators = Array.isArray(data.spectators) ? normalizeSpectators(data.spectators) : [];
      return { sponsors, participants, spectators };
    }
  }

  // 2) Separate endpoints (если на бэке сделаны отдельные ручки)
  const sponsorsCandidates = [
    `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/sponsors`,
    `${API_BASE_URL}/api/sponsorship/tournaments/${encodeURIComponent(tournamentId)}`,
  ];

  let sponsors: TournamentSponsorDTO[] = [];
  for (const url of sponsorsCandidates) {
    const data = await tryGetJson<any>(url, token);
    if (Array.isArray(data)) {
      sponsors = data.map(normalizeSponsor);
      break;
    }
    if (data && Array.isArray(data.sponsors)) {
      sponsors = data.sponsors.map(normalizeSponsor);
      break;
    }
  }

  const participantsCandidates = [
    `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/participants`,
  ];
  let participants: TournamentParticipantDTO[] = [];
  for (const url of participantsCandidates) {
    const data = await tryGetJson<any>(url, token);
    if (Array.isArray(data)) {
      participants = normalizeParticipants(data as TournamentParticipantDTO[]);
      break;
    }
    if (data && Array.isArray(data.participants)) {
      participants = normalizeParticipants(data.participants as TournamentParticipantDTO[]);
      break;
    }
  }
  // fallback: applications list (старый API)
  if (participants.length === 0) {
    try {
      const apps = await getApplications(tournamentId, token);
      participants = normalizeParticipants(apps.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        createdAt: a.createdAt,
        status: null,
      })));
    } catch {
      // ignore
    }
  }

  const spectatorsCandidates = [
    `${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/spectators`,
    `${API_BASE_URL}/api/tickets/tournaments/${encodeURIComponent(tournamentId)}`,
  ];
  let spectators: TournamentSpectatorDTO[] = [];
  for (const url of spectatorsCandidates) {
    const data = await tryGetJson<any>(url, token);
    if (Array.isArray(data)) {
      spectators = normalizeSpectators(data as TournamentSpectatorDTO[]);
      break;
    }
    if (data && Array.isArray(data.spectators)) {
      spectators = normalizeSpectators(data.spectators as TournamentSpectatorDTO[]);
      break;
    }
    if (data && Array.isArray(data.tickets)) {
      // вариант: { tickets: [{ userName, seatsCount, ...}] }
      spectators = normalizeSpectators(data.tickets as TournamentSpectatorDTO[]);
      break;
    }
  }

  return { sponsors, participants, spectators };
};

/* ---------------  AUDIENCE VOTING  ----------------- */

export const getKnightsForVoting = async (
  tournamentId: number,
  token: string,
): Promise<KnightForVotingDTO[]> => {
  const res = await fetch(`${API_BASE_URL}/api/tournaments/${encodeURIComponent(tournamentId)}/knights`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = new Error('Не удалось загрузить участников для голосования');
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
};

export const submitAudienceVote = async (
  tournamentId: number,
  votedForId: number,
  token: string,
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/votes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tournamentId, votedForId }),
  });

  if (!res.ok) {
    const err = new Error('Не удалось отправить голос');
    (err as any).status = res.status;
    throw err;
  }
};
