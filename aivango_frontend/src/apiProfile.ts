import { API_BASE_URL } from './config';

export type UserProfileDTO = {
  firstName?: string | null;
  lastName?: string | null;
  height?: number | null;
  weight?: number | null;
  motivation?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  coatOfArmsUrl?: string | null;
};

const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

export const getMyProfile = async (token: string): Promise<UserProfileDTO> => {
  const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
    headers: authHeaders(token),
  });
  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (!res.ok) throw new Error('Не удалось загрузить профиль');
  return res.json();
};

export const updateMyProfile = async (token: string, dto: UserProfileDTO): Promise<UserProfileDTO> => {
  const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (!res.ok) throw new Error('Не удалось обновить профиль');
  return res.json();
};

export const uploadCoatOfArms = async (token: string, file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/profile/me/coat-of-arms`, {
    method: 'POST',
    headers: authHeaders(token),
    body: fd,
  });

  if (res.status === 401) throw new Error('Необходимо войти в систему');
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Не удалось загрузить герб');
  }

  return res.text();
};
