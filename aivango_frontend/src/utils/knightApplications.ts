import { safeJsonParse, safeJsonStringify } from './storage';

const KEY = 'aivango-knight-applications';

export type LocalKnightApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LocalKnightApplication {
  tournamentId: number;
  status: LocalKnightApplicationStatus;
  submittedAtISO: string;
}

type AppsByUser = Record<string, Record<string, LocalKnightApplication>>;

export const getLocalKnightApplications = (userEmail: string): Record<string, LocalKnightApplication> => {
  const all = safeJsonParse<AppsByUser>(localStorage.getItem(KEY), {});
  return all[userEmail] ?? {};
};

export const getLocalKnightApplication = (userEmail: string, tournamentId: number): LocalKnightApplication | null => {
  const apps = getLocalKnightApplications(userEmail);
  return apps[String(tournamentId)] ?? null;
};

export const setLocalKnightApplication = (userEmail: string, app: LocalKnightApplication): void => {
  const all = safeJsonParse<AppsByUser>(localStorage.getItem(KEY), {});
  const userApps = all[userEmail] ?? {};
  userApps[String(app.tournamentId)] = app;
  all[userEmail] = userApps;
  localStorage.setItem(KEY, safeJsonStringify(all));
};
