import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getTournaments } from '../api';
import type { Tournament } from '../types';
import { getTournamentDateISO } from '../utils/tournamentUi';
import { createKnightApplication } from '../apiKnights';
import { getMyProfile, uploadCoatOfArms } from '../apiProfile';
import KnightTournamentApplicationForm, { type KnightApplicationFormSubmit } from '../components/KnightTournamentApplicationForm';

type ViewState = 'loading' | 'ready' | 'error' | 'unauth';

type LocalKnightDraft = {
  height?: number;
  weight?: number;
};

const readLocalKnightDraft = (): LocalKnightDraft => {
  try {
    const raw = localStorage.getItem('knightProfileDraft');
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return {};
    const toNum = (v: unknown): number | undefined => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
      return undefined;
    };
    return {
      height: toNum(obj.height),
      weight: toNum(obj.weight),
    };
  } catch {
    return {};
  }
};

export default function TournamentApplicationPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const tournamentId = Number(id);
  const token = user?.token ?? '';

  const [state, setState] = useState<ViewState>('loading');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<{
    firstName?: string | null;
    lastName?: string | null;
    height?: number | null;
    weight?: number | null;
    motivation?: string | null;
    birthDate?: string | null;
    coatOfArmsUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user?.token) {
      setState('unauth');
      return;
    }

    let alive = true;
    (async () => {
      try {
        setState('loading');
        setError(null);

        const [list, prof] = await Promise.all([
          getTournaments(token),
          getMyProfile(token).catch(() => null),
        ]);

        if (!alive) return;

        const found = list.find((t) => t.id === tournamentId) ?? null;
        setTournament(found);
        setProfile(prof);

        if (!found) {
          setError('Турнир не найден');
          setState('error');
          return;
        }

        setState('ready');
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Ошибка при загрузке данных');
        setState('error');
      }
    })();

    return () => {
      alive = false;
    };
  }, [tournamentId, token, user?.token]);

  const formData = useMemo(() => {
    if (!tournament || !user) return null;

    const venue = tournament.finalLocationName || tournament.finalLocation?.name || 'Локация уточняется';
    const dateISO = getTournamentDateISO(tournament);
    const collectedAmount = typeof tournament.collectedAmount === 'number' && Number.isFinite(tournament.collectedAmount)
      ? tournament.collectedAmount
      : 0;

    const localDraft = readLocalKnightDraft();

    const firstName = (profile?.firstName ?? user.firstName ?? '').trim() || user.email.split('@')[0] || 'Имя';
    const lastName = (profile?.lastName ?? user.lastName ?? '').trim() || 'Фамилия';

    const height = profile?.height ?? localDraft.height ?? null;
    const weight = profile?.weight ?? localDraft.weight ?? null;

    return {
      tournamentForm: {
        name: tournament.name,
        date: dateISO,
        venue,
        collectedAmount,
      },
      initial: {
        firstName,
        lastName,
        height,
        weight,
        motivation: profile?.motivation ?? null,
        birthDate: profile?.birthDate ?? null,
        coatOfArmsUrl: profile?.coatOfArmsUrl ?? null,
      },
    };
  }, [tournament, user, profile]);

  const handleBack = () => {
    if (Number.isFinite(tournamentId)) nav(`/tournaments/${tournamentId}`);
    else nav('/tournaments');
  };

  const handleSubmit = async (payload: KnightApplicationFormSubmit) => {
    if (!user?.token) throw new Error('Необходимо войти в систему');
    if (!tournament || !Number.isFinite(tournamentId)) throw new Error('Турнир не найден');

    await createKnightApplication(token, {
      tournamentId,
      knightName: payload.knightName,
      knightSurname: payload.knightSurname,
      height: payload.height ?? null,
      weight: payload.weight ?? null,
      motivation: payload.motivation ?? null,
      birthDate: payload.birthDate ?? null,
      coatOfArmsUrl: payload.coatOfArmsUrl ?? null,
    });
  };

  if (state === 'unauth') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-slate-700">Пожалуйста, авторизуйтесь для подачи заявки.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-slate-700">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (state === 'error' || !tournament || !formData) {
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
    <KnightTournamentApplicationForm
      tournament={formData.tournamentForm}
      initial={formData.initial}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onUploadCoatOfArms={(file) => uploadCoatOfArms(token, file)}
    />
  );
}
