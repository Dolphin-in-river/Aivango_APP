import { safeJsonParse, safeJsonStringify } from './storage';

const TICKETS_KEY = 'aivango-tickets';

export interface TicketPurchaseRecord {
  tournamentId: number;
  quantity: number;
  purchasedAtISO: string;
}

type TicketsByUser = Record<string, TicketPurchaseRecord[]>;

export const getUserTickets = (userEmail: string): TicketPurchaseRecord[] => {
  const all = safeJsonParse<TicketsByUser>(localStorage.getItem(TICKETS_KEY), {});
  return all[userEmail] ?? [];
};

export const hasTicketForTournament = (userEmail: string, tournamentId: number): boolean => {
  return getUserTickets(userEmail).some(t => t.tournamentId === tournamentId);
};

export const addTicketPurchase = (userEmail: string, record: TicketPurchaseRecord): void => {
  const all = safeJsonParse<TicketsByUser>(localStorage.getItem(TICKETS_KEY), {});
  const cur = all[userEmail] ?? [];
  all[userEmail] = [...cur.filter(t => t.tournamentId !== record.tournamentId), record];
  localStorage.setItem(TICKETS_KEY, safeJsonStringify(all));
};
