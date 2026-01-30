export type TournamentStatus = 'CREATED' | 'REGISTRATION' | 'TICKET_SALES' | 'IN_PROGRESS' | 'COMPLETED';
export type SponsorshipStatus = 'PENDING' | 'CONFIRMED';
export type PackageType = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Роли участия в рамках турнира.
// ORGANIZER здесь используется только для доступа к организаторским страницам в демо-модуле.
export type UserRole = 'SPECTATOR' | 'SPONSOR' | 'KNIGHT' | 'ORGANIZER';

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  targetAmount: number;
  collectedAmount: number;
  venue: string;
  date: string;
  description: string;
  requirements?: {
    minVictories: number;
    weightCategory?: string;
    minExperience?: number;
  };
  prizeCalculated?: boolean;
}

export interface SponsorPackage {
  type: PackageType;
  amount: number;
  logoSize: 'small' | 'medium' | 'large' | 'xlarge';
  benefits: string[];
}

export interface Sponsorship {
  id: string;
  tournamentId: string;
  companyName: string;
  package: PackageType;
  amount: number;
  logoUrl: string;
  status: SponsorshipStatus;
  venue: string;
  date: string;
}

export interface KnightProfile {
  id: string;
  name: string;
  height: number;
  weight: number;
  victories: number;
  experience: number;
}

export interface KnightApplication {
  id: string;
  tournamentId: string;
  knightId: string;
  knightName: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface PrizeDistribution {
  tournamentId: string;
  first: { knightId: string; knightName: string; amount: number };
  second: { knightId: string; knightName: string; amount: number };
  third: { knightId: string; knightName: string; amount: number };
  audienceChoice: { knightId: string; knightName: string; amount: number };
  calculatedAt: string;
}
