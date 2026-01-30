import { API_BASE_URL } from './config';

import type { TournamentBracketDTO } from './types';

const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

export const getTournamentBracketSafe = async (
  tournamentId: number,
  token: string,
): Promise<TournamentBracketDTO> => {
  const res = await fetch(`${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/bracket`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Не удалось получить турнирную сетку');
  }
  return res.json();
};

export const generateTournamentBracket = async (
  tournamentId: number,
  token: string,
): Promise<TournamentBracketDTO> => {
  const res = await fetch(`${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/generate-bracket`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Не удалось сформировать турнирную сетку');
  }
  return res.json();
};

export const recordFightResult = async (
  fightId: number,
  token: string,
  payload: { winnerId: number; comment?: string | null },
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/fights/${encodeURIComponent(fightId)}/result`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      winnerId: payload.winnerId,
      comment: payload.comment ?? null,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Не удалось сохранить результат боя');
  }
};

export const updateFightDate = async (
  fightId: number,
  token: string,
  newFightDateIso: string,
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/fights/${encodeURIComponent(fightId)}/date`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newFightDate: newFightDateIso,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Не удалось изменить время боя');
  }
};

export const completeTournament = async (
  tournamentId: number,
  token: string,
): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/api/tournament/${encodeURIComponent(tournamentId)}/complete`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(text || 'Не удалось завершить турнир');
  }
  return text || 'Турнир завершен';
};
