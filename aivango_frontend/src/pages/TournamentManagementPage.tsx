import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';

import { useAuth } from '../context/AuthContext';
import { getParticipantsByRole, getTournaments } from '../api';
import type { Tournament, TournamentBracketDTO, FightMatchDTO } from '../types';
import {
  completeTournament,
  generateTournamentBracket,
  getTournamentBracketSafe,
  recordFightResult,
  updateFightDate,
} from '../apiOrganizer';

type ViewState = 'loading' | 'ready' | 'error' | 'unauth';

type KnightApplication = {
  status?: string | null;
};

interface BracketMatch {
  id: string; // matchId
  round: string;
  knight1Id?: string;
  knight1Name?: string;
  knight2Id?: string;
  knight2Name?: string;
  winnerId?: string;
  scheduledTime?: string;
}

interface UiTournament {
  id: string;
  name: string;
  date: string;
  status: string;
}

const cn = (...xs: Array<string | null | undefined | false>) => xs.filter(Boolean).join(' ');

const toInputDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return '';
  // Backend LocalDateTime usually comes as "YYYY-MM-DDTHH:mm:ss" (no timezone)
  // input[type=datetime-local] accepts only up to minutes.
  if (iso.length >= 16) return iso.slice(0, 16);
  return iso;
};

const toBackendLocalDateTime = (value: string): string => {
  const v = value.trim();
  if (!v) return v;
  // "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:00"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  return v;
};

const completionStorageKey = (tournamentId: number) => `aivango:tournament:completeMessage:${tournamentId}`;

const extractAudienceChoiceWinner = (message: string | null): string | null => {
  if (!message) return null;
  const m = message.match(/Приз\s+Зрительск(?:их|ий)\s+Симпатий\s+получает:\s*([^\n\.]+)/i);
  return m?.[1]?.trim() ? m[1].trim() : null;
};

/* -------------------- Minimal UI kit (no extra deps) -------------------- */

type ButtonVariant = 'default' | 'outline';
type ButtonSize = 'sm' | 'md';

function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const { className, variant = 'default', size = 'md', ...rest } = props;

  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50';
  const sizes = size === 'sm' ? 'h-9 px-3' : 'h-10 px-4';
  const variants =
    variant === 'outline'
      ? 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
      : 'bg-slate-900 text-white hover:bg-slate-800';

  return <button className={cn(base, sizes, variants, className)} {...rest} />;
}

function Badge(props: HTMLAttributes<HTMLSpanElement>) {
  const { className, ...rest } = props;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium',
        className,
      )}
      {...rest}
    />
  );
}

function Spinner({ className }: { className?: string }) {
  return <span className={cn('aivango-spinner', className)} aria-hidden="true" />;
}

function Modal(props: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { open, onClose, children } = props;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------- Inline icons (simple, no deps) -------------------- */

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ArrowLeft = (p: { className?: string }) => (
  <Icon className={p.className}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </Icon>
);

const Trophy = (p: { className?: string }) => (
  <Icon className={p.className}>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
    <path d="M17 7h2a2 2 0 0 0 2-2V4h-4" />
    <path d="M7 7H5a2 2 0 0 1-2-2V4h4" />
  </Icon>
);

const Calendar = (p: { className?: string }) => (
  <Icon className={p.className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </Icon>
);

const Clock = (p: { className?: string }) => (
  <Icon className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6l4 2" />
  </Icon>
);

const Award = (p: { className?: string }) => (
  <Icon className={p.className}>
    <circle cx="12" cy="8" r="5" />
    <path d="M8.2 12.5 7 22l5-3 5 3-1.2-9.5" />
  </Icon>
);

const CheckCircle = (p: { className?: string }) => (
  <Icon className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

const Edit2 = (p: { className?: string }) => (
  <Icon className={p.className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
  </Icon>
);

const Save = (p: { className?: string }) => (
  <Icon className={p.className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </Icon>
);

const XIcon = (p: { className?: string }) => (
  <Icon className={p.className}>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </Icon>
);

const AlertTriangle = (p: { className?: string }) => (
  <Icon className={p.className}>
    <path d="M10.3 3.6a2 2 0 0 1 3.4 0l8.1 14a2 2 0 0 1-1.7 3H3.9a2 2 0 0 1-1.7-3l8.1-14Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);

const ROUND_NAMES: Record<string, string> = {
  ROUND_OF_16: '1/8 финала',
  QUARTERFINAL: 'Четвертьфинал',
  SEMIFINAL: 'Полуфинал',
  FINAL: 'Финал',
};

const TOURNAMENT_STATUS_META: Record<
  string,
  {
    label: string;
    badgeClass: string;
  }
> = {
  WAITING_DONATION: { label: 'Сбор средств', badgeClass: 'bg-amber-600/60 text-white' },
  KNIGHT_REGISTRATION: { label: 'Регистрация рыцарей', badgeClass: 'bg-blue-700 text-white' },
  TICKET_SALES: { label: 'Продажа билетов', badgeClass: 'bg-purple-600/60 text-white' },
  ACTIVE: { label: 'Активен', badgeClass: 'bg-green-600/60 text-white' },
  COMPLETED: { label: 'Завершен', badgeClass: 'bg-blue-700 text-white' },
};

function getTournamentStatusMeta(statusRaw: string | null | undefined) {
  const key = String(statusRaw ?? '').toUpperCase();
  return (
    TOURNAMENT_STATUS_META[key] ?? {
      label: key || 'Неизвестно',
      badgeClass: 'bg-white/15 text-white',
    }
  );
}

const mapBracketMatch = (m: FightMatchDTO): BracketMatch => ({
  id: String(m.matchId),
  round: String(m.round || ''),
  knight1Id: m.fighter1Id != null ? String(m.fighter1Id) : undefined,
  knight1Name: m.fighter1Name ?? undefined,
  knight2Id: m.fighter2Id != null ? String(m.fighter2Id) : undefined,
  knight2Name: m.fighter2Name ?? undefined,
  winnerId: m.winnerId != null ? String(m.winnerId) : undefined,
  scheduledTime: m.fightDate ?? undefined,
});

export default function TournamentManagementPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const tournamentId = Number(id);
  const token = user?.token ?? '';

  const [view, setView] = useState<ViewState>('loading');
  const [error, setError] = useState<string | null>(null);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [applications, setApplications] = useState<KnightApplication[]>([]);
  const [bracket, setBracket] = useState<TournamentBracketDTO | null>(null);

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string>('');
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [showCompletionResultModal, setShowCompletionResultModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const uiTournament: UiTournament | null = useMemo(() => {
    if (!tournament) return null;
    const date = tournament.eventDate ? `${tournament.eventDate}T00:00:00` : new Date().toISOString();
    return {
      id: String(tournament.id),
      name: tournament.name,
      date,
      status: String(tournament.tournamentStatus || ''),
    };
  }, [tournament]);

  const bracketMatches: BracketMatch[] = useMemo(() => {
    return (bracket?.matches ?? []).map(mapBracketMatch);
  }, [bracket]);

  // Grouping matches by round
  const matchesByRound = useMemo(() => {
    const grouped = bracketMatches.reduce((acc, match) => {
      const r = match.round || 'UNKNOWN';
      if (!acc[r]) acc[r] = [];
      acc[r].push(match);
      return acc;
    }, {} as Record<string, BracketMatch[]>);

    // IMPORTANT: Keep match order stable inside each round.
    // Backend may return matches in a different order after updating a result,
    // and using the render index ("Бой {index + 1}") would then visually
    // change the fight number for the same match card.
    // Sorting by stable match id fixes that.
    const toSortableId = (id: string) => {
      const n = Number(id);
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };
    Object.values(grouped).forEach((arr) => {
      arr.sort((a, b) => toSortableId(a.id) - toSortableId(b.id));
    });

    return grouped;
  }, [bracketMatches]);

  const refreshBracket = async () => {
    const b = await getTournamentBracketSafe(tournamentId, token);
    setBracket(b);
  };

  useEffect(() => {
    if (!user?.token) {
      setView('unauth');
      return;
    }
    if (!Number.isFinite(tournamentId)) {
      setError('Некорректный id турнира');
      setView('error');
      return;
    }

    let alive = true;
    (async () => {
      try {
        setView('loading');
        setError(null);

        const tournaments = await getTournaments(token);
        const t = tournaments.find((x) => x.id === tournamentId) ?? null;
        if (!t) {
          if (!alive) return;
          setError('Турнир не найден');
          setView('error');
          return;
        }

        const knights = await getParticipantsByRole(tournamentId, 'KNIGHT', token);
        const apps: KnightApplication[] = (knights ?? []).map((k) => ({
          status: (k.applicationStatus ?? null) ? String(k.applicationStatus) : null,
        }));

        let b: TournamentBracketDTO | null = null;
        try {
          b = await getTournamentBracketSafe(tournamentId, token);
        } catch {
          // If bracket is not generated yet, try generate
          b = await generateTournamentBracket(tournamentId, token);
        }

        if (!alive) return;
        setTournament(t);
        setApplications(apps);
        setBracket(b);

        // Если турнир уже завершен, попробуем поднять текст итогов из localStorage,
        // чтобы можно было показывать его в хедере после перезагрузки страницы.
        try {
          const statusKey = String(t.tournamentStatus ?? '').toUpperCase();
          if (statusKey === 'COMPLETED') {
            const stored = localStorage.getItem(completionStorageKey(tournamentId));
            if (stored) setCompletionMessage(stored);
          }
        } catch {
          // ignore storage errors
        }

        setView('ready');
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Ошибка при загрузке данных');
        setView('error');
      }
    })();

    return () => {
      alive = false;
    };
  }, [tournamentId, token, user?.token]);

  const approvedApplications = useMemo(
    () => applications.filter((a) => String(a.status ?? '').toUpperCase() === 'APPROVED'),
    [applications],
  );

  const completionAudienceChoice = useMemo(() => extractAudienceChoiceWinner(completionMessage), [completionMessage]);

  const finalResult = useMemo(() => {
    const final = bracketMatches.find((m) => String(m.round ?? '').toUpperCase() === 'FINAL') ?? null;
    if (!final) {
      return {
        championName: null as string | null,
        runnerUpName: null as string | null,
      };
    }
    const winnerId = final.winnerId ?? null;
    if (!winnerId) {
      return {
        championName: null as string | null,
        runnerUpName: null as string | null,
      };
    }
    const championName = winnerId === final.knight1Id ? (final.knight1Name ?? null) : (final.knight2Name ?? null);
    const runnerUpName = winnerId === final.knight1Id ? (final.knight2Name ?? null) : (final.knight1Name ?? null);
    return { championName, runnerUpName };
  }, [bracketMatches]);

  const getMatchStatus = (match: BracketMatch): 'scheduled' | 'in-progress' | 'completed' | 'pending' => {
    if (match.winnerId) return 'completed';
    if (match.scheduledTime && match.knight1Id && match.knight2Id) {
      const matchTime = new Date(match.scheduledTime);
      const now = new Date();
      if (matchTime <= now) return 'in-progress';
      return 'scheduled';
    }
    return 'pending';
  };

  const onBack = () => {
    if (Number.isFinite(tournamentId)) nav(`/tournaments/${tournamentId}`);
    else nav('/tournaments');
  };

  const onUpdateMatch = async (matchId: string, data: Partial<BracketMatch>): Promise<boolean> => {
    const fightId = Number(matchId);
    if (!Number.isFinite(fightId)) return false;
    if (!data.scheduledTime && !data.winnerId) return true;
    // Пока идет сохранение, блокируем любые изменения, чтобы не получить рассинхрон.
    setSavingMatchId(matchId);
    try {
      // Apply time change first (so winner selection sees fresh schedule if needed)
      if (data.scheduledTime) {
        await updateFightDate(fightId, token, toBackendLocalDateTime(data.scheduledTime));
      }
      if (data.winnerId) {
        await recordFightResult(fightId, token, { winnerId: Number(data.winnerId) });
      }
      await refreshBracket();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка при сохранении боя';
      alert(msg);
      return false;
    } finally {
      setSavingMatchId(null);
    }
  };

  const onCompleteTournament = async (): Promise<string> => {
    setIsCompleting(true);
    try {
      const message = await completeTournament(tournamentId, token);
      // Обновим статус сразу, чтобы кнопка "Завершить" скрылась без задержек
      setTournament((prev) => (prev ? { ...prev, tournamentStatus: 'COMPLETED' } : prev));
      // Дополнительно подтянем свежие данные турнира
      const tournaments = await getTournaments(token);
      const t = tournaments.find((x) => x.id === tournamentId) ?? null;
      setTournament(t);
      return message;
    } finally {
      setIsCompleting(false);
    }
  };

  const handleEditMatch = (match: BracketMatch) => {
    setEditingMatchId(match.id);
    setEditingTime(toInputDateTimeLocal(match.scheduledTime));
    setSelectedWinner(match.winnerId || null);
  };

  const handleSaveMatch = async (match: BracketMatch) => {
    if (savingMatchId) return;

    const updates: Partial<BracketMatch> = {};
    const originalTime = toInputDateTimeLocal(match.scheduledTime);
    const originalWinner = match.winnerId || null;

    if (editingTime && editingTime !== originalTime) updates.scheduledTime = editingTime;
    if (selectedWinner && selectedWinner !== originalWinner) updates.winnerId = selectedWinner;

    const ok = await onUpdateMatch(match.id, updates);
    if (!ok) return;

    setEditingMatchId(null);
    setEditingTime('');
    setSelectedWinner(null);
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setEditingTime('');
    setSelectedWinner(null);
  };

  const handleCompleteTournament = async () => {
    // allow complete only if all finished
    const unfinished = bracketMatches.filter((m) => !m.winnerId && m.knight1Id && m.knight2Id);
    if (unfinished.length > 0) {
      alert(`Невозможно завершить турнир. Остались незавершенные матчи: ${unfinished.length}`);
      return;
    }
    try {
      const message = await onCompleteTournament();
      setShowCompleteModal(false);
      setCompletionMessage(message);
      try {
        localStorage.setItem(completionStorageKey(tournamentId), message);
      } catch {
        // ignore storage errors
      }
      setShowCompletionResultModal(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось завершить турнир';
      alert(msg);
    }
  };

  if (view === 'unauth') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-slate-700">Пожалуйста, авторизуйтесь.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-slate-700">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (view === 'error' || !uiTournament) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-slate-700">{error || 'Не удалось открыть страницу'}</p>
            <button
              className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              onClick={() => nav('/tournaments')}
            >
              К списку турниров
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад к турниру
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-10 h-10" />
                <h1 className="text-3xl">Управление турниром</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="text-2xl">{uiTournament.name}</h2>
                <Badge className={getTournamentStatusMeta(uiTournament.status).badgeClass}>
                  {getTournamentStatusMeta(uiTournament.status).label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-indigo-100">
                <Calendar className="w-5 h-5" />
                <span>
                  {new Date(uiTournament.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {String(uiTournament.status).toUpperCase() === 'COMPLETED' &&
                (completionMessage || finalResult.championName || completionAudienceChoice) && (
                  <div className="mt-4 bg-white/15 border border-white/20 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Итоги турнира</div>
                    <div className="text-sm text-indigo-100 space-y-1">
                      {finalResult.championName && (
                        <div>
                          Победитель: <span className="text-white">{finalResult.championName}</span>
                        </div>
                      )}
                      {finalResult.runnerUpName && (
                        <div>
                          Финалист: <span className="text-white">{finalResult.runnerUpName}</span>
                        </div>
                      )}
                      {completionAudienceChoice && (
                        <div>
                          Приз зрительских симпатий: <span className="text-white">{completionAudienceChoice}</span>
                        </div>
                      )}
                      {completionMessage && (
                        <div className="text-white/90" style={{ whiteSpace: 'pre-line' }}>
                          {completionMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {String(uiTournament.status).toUpperCase() === 'ACTIVE' && (
              <Button
                onClick={() => setShowCompleteModal(true)}
                disabled={isCompleting || savingMatchId !== null}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCompleting ? <Spinner /> : <CheckCircle className="w-4 h-4" />}
                {isCompleting ? 'Завершение...' : 'Завершить турнир'}
              </Button>
            )}
          </div>
        </div>

        {/* Tournament info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg text-gray-900">Участников</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{approvedApplications.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg text-gray-900">Всего матчей</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600">{bracketMatches.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg text-gray-900">Завершено матчей</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{bracketMatches.filter((m) => m.winnerId).length}</p>
          </div>
        </div>

        {/* Matches management */}
        <div className="space-y-6">
          {Object.entries(matchesByRound).map(([round, matches]) => (
            <div key={round} className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl text-gray-900 mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-purple-600" />
                {ROUND_NAMES[round] || round}
              </h2>

              <div className="space-y-4">
                {matches.map((match, index) => {
                  const isEditing = editingMatchId === match.id;
                  const isSavingAny = savingMatchId !== null;
                  const isSavingThis = savingMatchId === match.id;
                  const matchStatus = getMatchStatus(match);
                  const originalTime = isEditing ? toInputDateTimeLocal(match.scheduledTime) : '';
                  const originalWinner = isEditing ? (match.winnerId || null) : null;
                  const isDirty = isEditing
                    ? (editingTime !== originalTime || selectedWinner !== originalWinner)
                    : false;

                  return (
                    <div
                      key={match.id}
                      className={cn(
                        'border rounded-lg p-6 transition-all',
                        matchStatus === 'completed' && 'border-green-200 bg-green-50',
                        matchStatus === 'in-progress' && 'border-blue-200 bg-blue-50',
                        matchStatus === 'scheduled' && 'border-slate-200 bg-white',
                        matchStatus === 'pending' && 'border-slate-200 bg-slate-50',
                        isEditing && 'ring-2 ring-purple-500',
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 rounded-full px-4 py-2">
                            <span className="font-medium text-slate-700">Бой {index + 1}</span>
                          </div>
                          <Badge
                            className={cn(
                              matchStatus === 'completed' && 'bg-green-100 text-green-800',
                              matchStatus === 'in-progress' && 'bg-blue-100 text-blue-800',
                              matchStatus === 'scheduled' && 'bg-amber-100 text-amber-800',
                              matchStatus === 'pending' && 'bg-slate-100 text-slate-800',
                            )}
                          >
                            {matchStatus === 'completed' && 'Завершён'}
                            {matchStatus === 'in-progress' && 'В процессе'}
                            {matchStatus === 'scheduled' && 'Запланирован'}
                            {matchStatus === 'pending' && 'Ожидает'}
                          </Badge>
                        </div>

                        {!isEditing ? (
                          <Button
                            onClick={() => handleEditMatch(match)}
                            variant="outline"
                            size="sm"
                            disabled={isSavingAny || isCompleting}
                          >
                            <Edit2 className="w-4 h-4" />
                            {matchStatus === 'completed' ? 'Изменить результат' : 'Редактировать'}
                          </Button>
                        ) : (
                          <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isSavingThis}>
                            <XIcon className="w-4 h-4" />
                            Отмена
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Knight 1 */}
                        <div
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all',
                            match.winnerId === match.knight1Id && !isEditing && 'border-green-500 bg-green-50',
                            match.winnerId !== match.knight1Id && 'border-slate-200',
                            isEditing && selectedWinner === match.knight1Id && 'border-green-500 bg-green-50',
                          )}
                        >
                          <p className="text-sm text-slate-600 mb-2">Рыцарь 1</p>
                          <p className="font-medium text-gray-900 mb-3">{match.knight1Name || 'TBD'}</p>

                          {isEditing && match.knight1Id && match.knight2Id && (
                            <Button
                              onClick={() => setSelectedWinner(match.knight1Id!)}
                              disabled={isSavingThis}
                              variant={selectedWinner === match.knight1Id ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'w-full',
                                selectedWinner === match.knight1Id && 'bg-green-600 hover:bg-green-700',
                              )}
                            >
                              {selectedWinner === match.knight1Id ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Победитель
                                </>
                              ) : (
                                'Выбрать победителем'
                              )}
                            </Button>
                          )}

                          {!isEditing && match.winnerId === match.knight1Id && (
                            <Badge className="bg-green-600 text-white w-full justify-center">
                              <CheckCircle className="w-4 h-4" />
                              Победитель
                            </Badge>
                          )}

                          {!isEditing && !match.winnerId && match.knight1Id && match.knight2Id && (
                            // В режиме просмотра кнопки победы не должны быть интерактивными.
                            // Редактирование результата доступно только после нажатия "Редактировать".
                            <Button
                              disabled
                              variant="outline"
                              size="sm"
                              className="w-full border-green-300 text-green-700 hover:bg-green-50"
                            >
                              Победа
                            </Button>
                          )}
                        </div>

                        {/* VS / Time */}
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-2xl font-bold text-slate-400 mb-4">VS</div>

                          {isEditing ? (
                            <div className="w-full">
                              <label className="block text-sm text-slate-600 mb-2">Время матча</label>
                              <input
                                type="datetime-local"
                                value={editingTime}
                                onChange={(e) => setEditingTime(e.target.value)}
                                disabled={isSavingThis}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              />
                            </div>
                          ) : (
                            <div className="text-center">
                              {match.scheduledTime ? (
                                <div className="flex items-center gap-2 text-slate-700">
                                  <Clock className="w-4 h-4" />
                                  <div>
                                    <div className="text-sm">
                                      {new Date(match.scheduledTime).toLocaleDateString('ru-RU', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </div>
                                    <div className="font-medium">
                                      {new Date(match.scheduledTime).toLocaleTimeString('ru-RU', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">Время не назначено</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Knight 2 */}
                        <div
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all',
                            match.winnerId === match.knight2Id && !isEditing && 'border-green-500 bg-green-50',
                            match.winnerId !== match.knight2Id && 'border-slate-200',
                            isEditing && selectedWinner === match.knight2Id && 'border-green-500 bg-green-50',
                          )}
                        >
                          <p className="text-sm text-slate-600 mb-2">Рыцарь 2</p>
                          <p className="font-medium text-gray-900 mb-3">{match.knight2Name || 'TBD'}</p>

                          {isEditing && match.knight1Id && match.knight2Id && (
                            <Button
                              onClick={() => setSelectedWinner(match.knight2Id!)}
                              disabled={isSavingThis}
                              variant={selectedWinner === match.knight2Id ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'w-full',
                                selectedWinner === match.knight2Id && 'bg-green-600 hover:bg-green-700',
                              )}
                            >
                              {selectedWinner === match.knight2Id ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Победитель
                                </>
                              ) : (
                                'Выбрать победителем'
                              )}
                            </Button>
                          )}

                          {!isEditing && match.winnerId === match.knight2Id && (
                            <Badge className="bg-green-600 text-white w-full justify-center">
                              <CheckCircle className="w-4 h-4" />
                              Победитель
                            </Badge>
                          )}

                          {!isEditing && !match.winnerId && match.knight1Id && match.knight2Id && (
                            <Button
                              disabled
                              variant="outline"
                              size="sm"
                              className="w-full border-green-300 text-green-700 hover:bg-green-50"
                            >
                              Победа
                            </Button>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                          <Button
                            onClick={() => handleSaveMatch(match)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={!isDirty || isSavingThis}
                          >
                            {isSavingThis ? <Spinner /> : <Save className="w-4 h-4" />}
                            {isSavingThis ? 'Сохраняем...' : 'Сохранить изменения'}
                          </Button>
                          {match.winnerId && (
                            <Button
                              onClick={() => {
                                alert('Сброс результата сейчас отключен. Вы говорили, что уберете ограничение на бэкенде - после этого можно добавить ручку сброса или разрешить перезапись.');
                              }}
                              disabled={isSavingThis}
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XIcon className="w-4 h-4" />
                              Сбросить результат
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Tournament Modal */}
      <Modal
        open={showCompleteModal}
        onClose={() => {
          if (!isCompleting) setShowCompleteModal(false);
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-2xl text-gray-900">Завершить турнир?</h3>
          </div>

          <p className="text-slate-700 mb-6">
            Вы уверены, что хотите завершить турнир <strong>"{uiTournament.name}"</strong>? После завершения статус
            турнира изменится на "COMPLETED".
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Проверьте перед завершением:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>✓ Все матчи завершены и определены победители</li>
              <li>✓ Призовой фонд рассчитан</li>
              <li>✓ Результаты проверены</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCompleteTournament}
              disabled={isCompleting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? <Spinner /> : <CheckCircle className="w-4 h-4" />}
              {isCompleting ? 'Завершаем...' : 'Да, завершить турнир'}
            </Button>
            <Button
              onClick={() => setShowCompleteModal(false)}
              disabled={isCompleting}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* Completion Result Modal (replaces browser alert) */}
      <Modal
        open={showCompletionResultModal}
        onClose={() => {
          if (!isCompleting) setShowCompletionResultModal(false);
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl text-gray-900">Турнир завершен</h3>
              </div>
              <div className="text-slate-700">
                <strong>{uiTournament.name}</strong>
              </div>
            </div>
            <Badge className="bg-blue-700 text-white">COMPLETED</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Победитель турнира</div>
              <div className="text-lg font-medium text-gray-900">
                {finalResult.championName ?? 'Не определен'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Финалист</div>
              <div className="text-lg font-medium text-gray-900">{finalResult.runnerUpName ?? 'Не определен'}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Приз зрительских симпатий</div>
              <div className="text-lg font-medium text-gray-900">
                {completionAudienceChoice ?? 'Нет данных'}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Матчей завершено</div>
              <div className="text-lg font-medium text-gray-900">
                {bracketMatches.filter((m) => m.winnerId).length} из {bracketMatches.length}
              </div>
            </div>
          </div>

          {completionMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-800 font-medium mb-2">Сообщение системы</div>
              <div className="text-sm text-blue-700" style={{ whiteSpace: 'pre-line' }}>
                {completionMessage}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setShowCompletionResultModal(false)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Закрыть
            </Button>
            <Button
              onClick={() => {
                setShowCompletionResultModal(false);
                nav(`/tournaments/${tournamentId}`);
              }}
              variant="outline"
              className="flex-1"
            >
              Перейти к турниру
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
