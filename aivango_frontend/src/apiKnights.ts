import { API_BASE_URL } from './config';

export type KnightApplicationStatus = 'APPROVED' | 'REJECTED' | 'PENDING' | 'EDITS';

// DTO from backend for GET /api/application/tournament/{tournamentId}
export type TournamentApplicationListItem = {
  id: number;
  fullName: string;
  createdAt: string; // ISO string
};

// DTO from backend for GET /api/application/{applicationId}
export type ApplicationDetailDTO = {
  id: number;
  tournamentId: number;
  status: KnightApplicationStatus;
  comment?: string | null;
  knightProfile?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    height?: number | null;
    weight?: number | null;
    motivation?: string | null;
    birthDate?: string | null;
    coatOfArmsUrl?: string | null;
  };
};

// DTO to create an application: POST /api/application
export type KnightApplicationCreateDTO = {
  tournamentId: number;
  knightName: string;
  knightSurname: string;
  height?: number | null;
  weight?: number | null;
  motivation?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  coatOfArmsUrl?: string | null;
};

const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

export const fetchTournamentApplications = async (
  token: string,
  tournamentId: number,
): Promise<TournamentApplicationListItem[]> => {
  const res = await fetch(
    `${API_BASE_URL}/api/application/tournament/${encodeURIComponent(tournamentId)}`,
    { headers: authHeaders(token) },
  );
  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (!res.ok) throw new Error('Не удалось получить список заявок');
  return res.json();
};

export const getApplicationById = async (
  token: string,
  applicationId: number,
): Promise<ApplicationDetailDTO> => {
  const res = await fetch(
    `${API_BASE_URL}/api/application/${encodeURIComponent(applicationId)}`,
    { headers: authHeaders(token) },
  );
  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (!res.ok) throw new Error('Не удалось получить заявку');
  return res.json();
};

export const updateApplicationStatus = async (
  token: string,
  applicationId: number,
  status: KnightApplicationStatus,
  comment?: string,
): Promise<void> => {
  const res = await fetch(
    `${API_BASE_URL}/api/application/${encodeURIComponent(applicationId)}/status`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, comment }),
    },
  );
  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (!res.ok) throw new Error('Не удалось обновить статус заявки');
};

export const createKnightApplication = async (
  token: string,
  dto: KnightApplicationCreateDTO,
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/application`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (res.status === 400) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Не удалось отправить заявку');
  }
  if (!res.ok) throw new Error('Не удалось отправить заявку');
};
