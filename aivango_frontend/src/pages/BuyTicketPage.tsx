import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { bookTicket, getTournaments } from '../api';
import type { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import { isOrganizerRole } from '../utils/roles';
import {
  canBuyTicketForTournament,
  formatTournamentDate,
  getTournamentDateISO,
  normalizeTournamentStatus,
  STATUS_LABELS,
} from '../utils/tournamentUi';

const TICKET_PRICE_RUB = 1500; // заглушка, пока нет API

const BuyTicketPage: React.FC = () => {
  const { id } = useParams();
  const tournamentId = Number(id);
  const nav = useNavigate();
  const { user } = useAuth();

  const token = user?.token ?? '';
  const organizer = !!user?.isOrganizer || isOrganizerRole(user?.role);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [quantity, setQuantity] = useState(1);
  const [agreeToRules, setAgreeToRules] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token || !Number.isFinite(tournamentId)) {
        setState('error');
        return;
      }

      setState('loading');
      try {
        const list = await getTournaments(token);
        if (cancelled) return;
        setTournament(list.find(t => t.id === tournamentId) ?? null);
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, tournamentId]);

  const ui = useMemo(() => {
    if (!tournament) return null;
    const status = normalizeTournamentStatus(tournament.tournamentStatus);
    const dateISO = getTournamentDateISO(tournament);
    const statusInfo = STATUS_LABELS[status];
    const gate = canBuyTicketForTournament(status, dateISO);

    return {
      dateLabel: formatTournamentDate(dateISO),
      statusInfo,
      gate,
    };
  }, [tournament]);

  const total = useMemo(() => quantity * TICKET_PRICE_RUB, [quantity]);

  const maxByAvailableSeats = useMemo(() => {
    if (!tournament) return undefined;
    const av = tournament.availableSeats;
    if (typeof av === 'number' && Number.isFinite(av) && av > 0) return av;
    return undefined;
  }, [tournament]);

  // Глобально различаем только обычного пользователя и организатора.
  // Покупка билета доступна для обычного пользователя.
  const canUsePage = !!token && Number.isFinite(tournamentId) && !organizer;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canUsePage || !tournament || !ui) return;

    setSaving(true);
    setErr(null);

    try {
      if (!ui.gate.ok) throw new Error(ui.gate.reason || 'Продажа билетов недоступна');
      if (quantity < 1) throw new Error('Количество билетов должно быть больше 0');
      if (typeof maxByAvailableSeats === 'number' && quantity > maxByAvailableSeats) {
        throw new Error('Недостаточно свободных мест');
      }
      if (!agreeToRules) throw new Error('Нужно согласие с правилами');

      await bookTicket(token, tournamentId, quantity, agreeToRules);

      nav(`/tournaments/${tournamentId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось купить билет');
    } finally {
      setSaving(false);
    }
  };

  if (!canUsePage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-slate-900 text-lg mb-2">Страница недоступна</div>
            <p className="text-slate-600 mb-6">Покупка билета недоступна для организатора.</p>
            <Link
              to="/tournaments"
              className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Вернуться к турнирам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="text-slate-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (state === 'error' || !tournament || !ui) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-slate-900 text-lg mb-2">Не удалось открыть покупку билета</div>
            <Link
              to="/tournaments"
              className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Вернуться к турнирам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link
            to={`/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <span>←</span>
            Назад
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">Покупка билета</h1>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-slate-900">{tournament.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${ui.statusInfo.badgeClass}`}>{ui.statusInfo.label}</span>
          </div>
          <div className="text-slate-600 mb-6">Дата: {ui.dateLabel}</div>

          {!ui.gate.ok && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 mb-6">
              Продажа билетов недоступна: {ui.gate.reason}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Цена</div>
                  <div className="text-lg font-semibold text-slate-900">{TICKET_PRICE_RUB.toLocaleString('ru-RU')} ₽</div>
                </div>

                <div>
                  <label className="text-sm text-slate-600">
                    Количество{typeof maxByAvailableSeats === 'number' ? ` (1-${maxByAvailableSeats})` : ''}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={typeof maxByAvailableSeats === 'number' ? maxByAvailableSeats : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeToRules}
                  onChange={(e) => setAgreeToRules(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm text-slate-700">
                  Согласие с правилами турнира
                </span>
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <span className="text-slate-700">Итого</span>
                <span className="text-xl font-semibold text-slate-900">{total.toLocaleString('ru-RU')} ₽</span>
              </div>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !ui.gate.ok}
                className={`w-full px-4 py-3 rounded-xl text-white ${saving || !ui.gate.ok ? 'bg-slate-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {saving ? 'Покупка...' : 'Купить билет'}
              </button>

              <div className="text-xs text-slate-500">
                Бронирование создается через API. Оплата пока не реализована.
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuyTicketPage;
