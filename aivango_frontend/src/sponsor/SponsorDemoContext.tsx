import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTournaments as fetchTournaments } from '../api';
import type { Tournament as ApiTournament } from '../types';
import { getCollectedAmountStub, getTournamentDateISO, normalizeTournamentStatus } from '../utils/tournamentUi';
import type {
  ApplicationStatus,
  KnightApplication,
  KnightProfile,
  PackageType,
  PrizeDistribution,
  SponsorPackage,
  Sponsorship,
  Tournament,
  TournamentStatus,
  UserRole,
} from './types';
import { INITIAL_PRIZE_DISTRIBUTIONS, MOCK_KNIGHT, MOCK_TOURNAMENTS, SPONSOR_PACKAGES } from './mockData';

const mapAuthRoleToSponsorRole = (role?: string | null): UserRole => {
  // Глобально в системе различаем только обычного пользователя и организатора.
  // Роли SPONSOR / KNIGHT / SPECTATOR трактуем как роли участия в турнире.
  // Пока API не трогаем, поэтому для всех не-организаторов выставляем SPECTATOR.
  if (!role) return 'SPECTATOR';
  const r = String(role).trim().toLowerCase();

  if (r === 'organizer' || r === 'organiser' || r === 'организатор' || r === 'orgranizer' || r === 'организатор ') return 'ORGANIZER';

  return 'SPECTATOR';
};

const mapUiStatusToSponsorStatus = (rawStatus?: string | null): TournamentStatus => {
  const ui = normalizeTournamentStatus(rawStatus);
  if (ui === 'UNKNOWN') return 'CREATED';
  return ui as TournamentStatus;
};

const getVenueFromApiTournament = (t: ApiTournament): string => {
  const loc = t.finalLocation ?? t.selectedLocations?.[0] ?? null;
  if (!loc) return 'Локация уточняется';
  return loc.address ? `${loc.name}, ${loc.address}` : loc.name;
};

const getRequirementsStub = (tournamentId: number) => {
  // Заглушка, пока нет требований в API
  return {
    minVictories: 3 + (tournamentId % 7),
    minExperience: 1 + (tournamentId % 5),
  };
};

const mapApiTournamentToSponsorTournament = (t: ApiTournament): Tournament => {
  const status = mapUiStatusToSponsorStatus(t.tournamentStatus);
  const targetAmount = Math.round(Number(t.requiredAmount) || 0);
  const collectedAmount = Math.round(getCollectedAmountStub(t));
  const date = getTournamentDateISO(t);

  return {
    id: String(t.id),
    name: t.name,
    status,
    targetAmount,
    collectedAmount,
    venue: getVenueFromApiTournament(t),
    date,
    description: t.description || '',
    requirements: getRequirementsStub(t.id),
    prizeCalculated: false,
  };
};

type SponsorSubmitPayload = {
  tournamentId: string;
  companyName: string;
  packageType: PackageType;
  amount: number;
  logoFile: File;
  venue: string;
  date: string;
};

type SponsorDemoContextValue = {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  sponsorPackages: SponsorPackage[];
  currentKnight: KnightProfile;

  tournaments: Tournament[];
  sponsorships: Sponsorship[];
  applications: KnightApplication[];
  prizeDistributions: PrizeDistribution[];

  getTournamentById: (id: string) => Tournament | undefined;
  getSponsorshipById: (id: string) => Sponsorship | undefined;
  getPrizeDistributionByTournamentId: (tournamentId: string) => PrizeDistribution | undefined;

  createSponsorship: (payload: SponsorSubmitPayload) => { sponsorshipId: string };
  submitKnightApplication: (tournamentId: string) => { applicationId: string };
  approveApplication: (applicationId: string, comment?: string) => void;
  rejectApplication: (applicationId: string, comment?: string) => void;
  calculatePrizes: (tournamentId: string) => void;
};

const SponsorDemoContext = createContext<SponsorDemoContextValue | null>(null);

export const SponsorDemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const derivedRole = useMemo<UserRole>(() => mapAuthRoleToSponsorRole(user?.role ?? null), [user?.role]);

  const [userRole, setUserRole] = useState<UserRole>(derivedRole);
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [applications, setApplications] = useState<KnightApplication[]>([]);
  const [prizeDistributions, setPrizeDistributions] = useState<PrizeDistribution[]>(INITIAL_PRIZE_DISTRIBUTIONS);
  const [currentKnight] = useState<KnightProfile>(MOCK_KNIGHT);


  const token = user?.token ?? '';

  // Подтягиваем список турниров из backend и маппим в структуру sponsor-модуля.
  // Если API недоступно - остаёмся на моках.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setTournaments(MOCK_TOURNAMENTS);
        return;
      }

      try {
        const list = await fetchTournaments(token);
        if (cancelled) return;
        setTournaments(list.map(mapApiTournamentToSponsorTournament));
      } catch {
        if (!cancelled) setTournaments(MOCK_TOURNAMENTS);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);
  // Роль должна зависеть от аккаунта. При смене пользователя синхронизируем.
  useEffect(() => {
    setUserRole(derivedRole);
  }, [derivedRole]);

  const getTournamentById = (id: string) => tournaments.find((t) => t.id === id);
  const getSponsorshipById = (id: string) => sponsorships.find((s) => s.id === id);
  const getPrizeDistributionByTournamentId = (tournamentId: string) =>
    prizeDistributions.find((p) => p.tournamentId === tournamentId);

  const createSponsorship = (payload: SponsorSubmitPayload) => {
    const tournament = tournaments.find((t) => t.id === payload.tournamentId);
    if (!tournament) {
      throw new Error('Турнир не найден');
    }

    if (tournament.collectedAmount >= tournament.targetAmount) {
      throw new Error('Турнир уже набрал необходимую сумму');
    }

    const logoUrl = URL.createObjectURL(payload.logoFile);

    const newSponsorship: Sponsorship = {
      id: `sp-${Date.now()}`,
      tournamentId: payload.tournamentId,
      companyName: payload.companyName,
      package: payload.packageType,
      amount: payload.amount,
      logoUrl,
      status: 'CONFIRMED',
      venue: payload.venue,
      date: payload.date,
    };

    setSponsorships((prev) => [...prev, newSponsorship]);

    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id !== payload.tournamentId) return t;

        const newCollectedAmount = t.collectedAmount + payload.amount;
        const newStatus: TournamentStatus = newCollectedAmount >= t.targetAmount ? 'REGISTRATION' : t.status;

        return { ...t, collectedAmount: newCollectedAmount, status: newStatus };
      }),
    );

    return { sponsorshipId: newSponsorship.id };
  };

  const submitKnightApplication = (tournamentId: string) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) {
      throw new Error('Турнир не найден');
    }

    if (tournament.status !== 'REGISTRATION') {
      throw new Error('Регистрация на турнир закрыта');
    }

    const existing = applications.find((a) => a.tournamentId === tournamentId && a.knightId === currentKnight.id);
    if (existing) {
      throw new Error(`Заявка уже подана. Текущий статус: ${existing.status}`);
    }

    if (tournament.requirements) {
      if (currentKnight.victories < tournament.requirements.minVictories) {
        throw new Error(`Не выполнено требование: минимум ${tournament.requirements.minVictories} побед`);
      }
      if (tournament.requirements.minExperience && currentKnight.experience < tournament.requirements.minExperience) {
        throw new Error(`Не выполнено требование: минимум ${tournament.requirements.minExperience} лет опыта`);
      }
    }

    const newApplication: KnightApplication = {
      id: `app-${Date.now()}`,
      tournamentId,
      knightId: currentKnight.id,
      knightName: currentKnight.name,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    setApplications((prev) => [...prev, newApplication]);
    return { applicationId: newApplication.id };
  };

  const approveApplication = (applicationId: string, comment?: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? ({ ...app, status: 'APPROVED' as ApplicationStatus, reviewedAt: new Date().toISOString(), reviewComment: comment } as KnightApplication)
          : app,
      ),
    );
  };

  const rejectApplication = (applicationId: string, comment?: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? ({ ...app, status: 'REJECTED' as ApplicationStatus, reviewedAt: new Date().toISOString(), reviewComment: comment } as KnightApplication)
          : app,
      ),
    );
  };

  const calculatePrizes = (tournamentId: string) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;
    if (tournament.prizeCalculated) return;

    const totalPrize = tournament.collectedAmount;

    const mockWinners = {
      first: { knightId: 'k1', knightName: 'Сэр Галахад' },
      second: { knightId: 'k2', knightName: 'Сэр Гавейн' },
      third: { knightId: 'k3', knightName: 'Сэр Персиваль' },
      audienceChoice: { knightId: 'k1', knightName: 'Сэр Галахад' },
    };

    const distribution: PrizeDistribution = {
      tournamentId,
      first: { ...mockWinners.first, amount: totalPrize * 0.5 },
      second: { ...mockWinners.second, amount: totalPrize * 0.25 },
      third: { ...mockWinners.third, amount: totalPrize * 0.1 },
      audienceChoice: { ...mockWinners.audienceChoice, amount: totalPrize * 0.05 },
      calculatedAt: new Date().toISOString(),
    };

    setPrizeDistributions((prev) => [...prev, distribution]);
    setTournaments((prev) => prev.map((t) => (t.id === tournamentId ? { ...t, prizeCalculated: true } : t)));
  };

  const value = useMemo<SponsorDemoContextValue>(
    () => ({
      userRole,
      setUserRole,

      sponsorPackages: SPONSOR_PACKAGES,
      currentKnight,

      tournaments,
      sponsorships,
      applications,
      prizeDistributions,

      getTournamentById,
      getSponsorshipById,
      getPrizeDistributionByTournamentId,

      createSponsorship,
      submitKnightApplication,
      approveApplication,
      rejectApplication,
      calculatePrizes,
    }),
    [userRole, currentKnight, tournaments, sponsorships, applications, prizeDistributions],
  );

  return <SponsorDemoContext.Provider value={value}>{children}</SponsorDemoContext.Provider>;
};

export const useSponsorDemo = (): SponsorDemoContextValue => {
  const ctx = useContext(SponsorDemoContext);
  if (!ctx) throw new Error('useSponsorDemo must be used within SponsorDemoProvider');
  return ctx;
};
