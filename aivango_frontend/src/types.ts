// User profile returned from API (and used in AuthContext)
export interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isOrganizer?: boolean;
  token?: string;
}

// Requests for authentication flows
export interface RegisterRequest {
  email: string;
  name: string;         // matches backend UserCreateRequest "name"
  secondName: string;   // matches backend UserCreateRequest "secondName"
}
export interface LoginRequest {
  email: string;
}
export interface VerifyCodeRequest {
  email: string;
  code: string;
}

/* --- Location returned inside TournamentDTO --- */
export interface Location {
  id: number;
  name: string;
  address: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

/* --- TournamentDTO from backend --- */
export interface Tournament {
  id: number;
  name: string;

  // Финансы
  requiredAmount: number;
  collectedAmount?: number;
  description: string;
  prizePercentNum: number;
  tournamentStatus: string;     // enum приходит строкой

  // Места для зрителей
  totalSeats?: number;
  availableSeats?: number;

  // Дата проведения (LocalDate -> "YYYY-MM-DD")
  eventDate?: string;

  // Локация (в новом API приходит finalLocationName)
  finalLocationName?: string | null;

  // Старые поля (могут отсутствовать в новом API)
  selectedLocations?: Location[];
  finalLocation?: Location | null;

  // Организатор
  organizerName?: string;

  // Места для рыцарей
  totalKnights?: number;
  availableKnightSlots?: number;

  // Роль текущего пользователя в этом турнире
  userRole?: string | null;
}

export interface TournamentCreateRequest {
  name: string;
  requiredAmount: number;
  description: string;
  prizePercentNum: number;
  eventDate: string; // "YYYY-MM-DD"
  totalSeats: number;
  requiredKnights: number;
  selectedLocationsIds: number[];
}

export interface AuthTokenResponse {
  accessToken: string;
  name: string;
  secondName: string;
  isOrganizer: boolean;
}

export interface ApplicationDTO {
  id: number;
  fullName: string;
  createdAt: string;
}

/* --- Bracket DTOs from backend --- */
export interface FightMatchDTO {
  matchId: number;
  round: string;
  roundDisplayName: string;

  fighter1Id?: number | null;
  fighter1Name?: string | null;

  fighter2Id?: number | null;
  fighter2Name?: string | null;

  winnerId?: number | null;
  winnerName?: string | null;

  // LocalDateTime -> ISO string
  fightDate?: string | null;

  comment?: string | null;
  nextMatchId?: number | null;
}

export interface TournamentBracketDTO {
  tournamentId: number;
  tournamentName: string;
  generatedAt: string;
  matches: FightMatchDTO[];
}

/* --- Public lists on Tournament page (sponsors, participants, spectators) --- */

export type SponsorshipPackageType = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | string;

export interface TournamentSponsorDTO {
  id?: number;
  companyName?: string | null;
  logoPath?: string | null;
  amount?: number | null;
  packageType?: SponsorshipPackageType | null;
  // Possible backend naming
  package?: SponsorshipPackageType | null;
  logoUrl?: string | null;
}

export interface TournamentParticipantDTO {
  id?: number;
  fullName?: string | null;
  name?: string | null;
  secondName?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

export interface TournamentSpectatorDTO {
  id?: number;
  fullName?: string | null;
  name?: string | null;
  secondName?: string | null;
  seatsCount?: number | null;
  createdAt?: string | null;
}

export interface TournamentRosterDTO {
  sponsors?: TournamentSponsorDTO[];
  participants?: TournamentParticipantDTO[];
  spectators?: TournamentSpectatorDTO[];
}

/* --- Voting DTOs --- */

export interface KnightForVotingDTO {
  id: number;
  name?: string | null;
  secondName?: string | null;
}
