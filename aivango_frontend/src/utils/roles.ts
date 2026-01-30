export const normalizeRole = (role?: string): string => {
  if (!role) return '';
  return String(role).trim().toLowerCase();
};

export const isOrganizerRole = (role?: string): boolean => {
  const r = normalizeRole(role);
  return r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer';
};

export const isKnightRole = (role?: string): boolean => {
  const r = normalizeRole(role);
  return r === 'knight' || r === 'рыцарь' || r === 'participant';
};

export const isSponsorRole = (role?: string): boolean => {
  const r = normalizeRole(role);
  return r === 'sponsor' || r === 'спонсор';
};

export const isSpectatorRole = (role?: string): boolean => {
  const r = normalizeRole(role);
  return r === 'spectator' || r === 'зритель' || r === 'viewer';
};
