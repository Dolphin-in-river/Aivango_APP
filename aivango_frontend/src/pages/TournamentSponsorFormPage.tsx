import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createSponsorship, getTournaments, type SponsorshipPackageType } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Tournament } from '../types';
import { formatTournamentDate, getTournamentDateISO, normalizeTournamentStatus } from '../utils/tournamentUi';
import { SPONSOR_PACKAGES } from '../sponsor/mockData';

const VALID_FORMATS = ['image/png', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024;

const getTournamentVenue = (t: Tournament): string => {
  if (t.finalLocationName) return t.finalLocationName;
  const loc = t.finalLocation ?? t.selectedLocations?.[0] ?? null;
  if (!loc) return 'Локация уточняется';
  return loc.address ? `${loc.name}, ${loc.address}` : loc.name;
};

const mapUiPackageToApi = (pkg: string): SponsorshipPackageType => {
  const p = String(pkg).trim().toLowerCase();
  if (p === 'bronze') return 'BRONZE';
  if (p === 'silver') return 'SILVER';
  if (p === 'gold') return 'GOLD';
  return 'PLATINUM';
};

export default function TournamentSponsorFormPage() {
  const nav = useNavigate();
  const { tournamentId, packageType } = useParams();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const selectedPackage = useMemo(() => {
    const pt = String(packageType ?? '').trim();
    return SPONSOR_PACKAGES.find((p) => p.type === pt) ?? null;
  }, [packageType]);

  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token || !tournamentId) {
        setState('error');
        return;
      }
      setState('loading');
      try {
        const list = await getTournaments(token);
        if (cancelled) return;
        const found = list.find((t) => String(t.id) === String(tournamentId)) ?? null;
        setTournament(found);
        setState(found ? 'ready' : 'error');
      } catch {
        if (!cancelled) setState('error');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, tournamentId]);

  const info = useMemo(() => {
    if (!tournament) return null;
    const venue = getTournamentVenue(tournament);
    const dateISO = getTournamentDateISO(tournament);
    const dateLabel = formatTournamentDate(dateISO);
    const status = normalizeTournamentStatus(tournament.tournamentStatus);
    return { venue, dateISO, dateLabel, status };
  }, [tournament]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VALID_FORMATS.includes(file.type) || file.size > MAX_SIZE) {
      setError('Поддерживаются только PNG, SVG до 2 МБ');
      setLogoFile(null);
      return;
    }

    setError('');
    setLogoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !selectedPackage || !tournamentId) return;

    if (!companyName.trim()) {
      setError('Введите название компании');
      return;
    }
    if (!agreedToTerms) {
      setError('Необходимо согласие с условиями');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createSponsorship(token, Number(tournamentId), {
        packageType: mapUiPackageToApi(selectedPackage.type),
        companyName: companyName.trim(),
      });
      // Backend не возвращает id, поэтому просто возвращаем на страницу турнира.
      nav(`/tournaments/${tournament.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-slate-600">Загрузка...</div>;
  }

  if (!tournament || !selectedPackage || !info) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-slate-700">Данные не найдены</p>
        <button
          className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          onClick={() => nav('/tournaments')}
        >
          К списку турниров
        </button>
      </div>
    );
  }

  // Спонсорство доступно только во время сбора средств
  const sponsorshipOpen = info.status === 'CREATED';

  if (!sponsorshipOpen) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-slate-900 font-semibold mb-2">Спонсорство недоступно</p>
        <p className="text-slate-700">Сбор средств закрыт для этого турнира.</p>
        <button
          className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          onClick={() => nav(`/tournaments/${tournament.id}`)}
        >
          Назад к турниру
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => nav(`/tournaments/sponsor/${tournament.id}`)}
          className="text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          Назад к выбору пакета
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Данные спонсора</h1>
            <p className="text-slate-600">Заполнение информации для оформления спонсорства</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Выбранный пакет</p>
                <p className="text-slate-900 font-semibold">{selectedPackage.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Сумма взноса</p>
                <p className="text-slate-900 font-semibold">{selectedPackage.amount.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <div className="text-slate-700 text-sm">
              Турнир: <span className="font-medium">{tournament.name}</span>
            </div>
            <div className="text-slate-600 text-sm">{info.venue} • {info.dateLabel}</div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-slate-700 mb-2">
                Название компании *
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='ООО "Ваша компания"'
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Герб или логотип (PNG, SVG, до 2 МБ)</label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.svg,image/png,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {logoFile ? (
                  <div>
                    <p className="text-slate-900 mb-1">{logoFile.name}</p>
                    <p className="text-sm text-slate-500">{(logoFile.size / 1024).toFixed(0)} КБ</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-700 mb-1">Нажмите для загрузки герба или логотипа</p>
                    <p className="text-sm text-slate-500">Пока backend не принимает файл, логотип сохраняется только для UI</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Согласие с условиями спонсорства и подтверждение права представлять компанию.
                </span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => nav(`/tournaments/${tournament.id}`)}
                className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors ${
                  submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Внести взнос
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
