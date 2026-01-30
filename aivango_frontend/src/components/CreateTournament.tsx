import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createTournament, fetchLocations } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Location } from '../types';

const CreateTournament: React.FC = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const token = user?.token ?? '';

  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);


  const [name, setName] = useState('');
  const [requiredAmount, setRequiredAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [prizePercent, setPrizePercent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [requiredKnights, setRequiredKnights] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // redirect
  useEffect(() => {
    if (!token) nav('/login');
  }, [token, nav]);

  // load locations
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoadingLocations(true);

    fetchLocations(token)
      .then((data) => {
        if (cancelled) return;
        setLocations(data);
      })
      .catch(() => {
        if (cancelled) return;
        setErrors(['Не удалось загрузить локации']);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingLocations(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);
const toggleLocation = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const validate = (): boolean => {
    const errs: string[] = [];

    if (!name.trim()) errs.push('Название турнира не может быть пустым');

    const required = Number(requiredAmount);
    if (!requiredAmount || Number.isNaN(required) || required <= 0) {
      errs.push('Требуемая сумма должна быть больше нуля');
    }

    const percent = Number(prizePercent);
    if (!prizePercent || Number.isNaN(percent) || percent < 20 || percent > 50) {
      errs.push('Призовой фонд турнира должен быть не менее 20% и не более 50%');
    }

    if (!desc.trim()) errs.push('Описание турнира не может быть пустым');
    if (!eventDate) errs.push('Дата проведения турнира не указана');

    const seats = Number(totalSeats);
    if (!totalSeats || Number.isNaN(seats) || seats <= 0) {
      errs.push('Количество мест для зрителей должно быть больше нуля');
    }

    const knights = Number(requiredKnights);
    if (!requiredKnights || Number.isNaN(knights) || knights <= 0) {
      errs.push('Количество мест для рыцарей должно быть больше нуля');
    }

    if (selected.length < 5 || selected.length > 10) {
      errs.push('Должно быть выбрано минимум 5 и максимум 10 планируемых площадок');
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const isFormValid = useMemo(() => {
    const required = Number(requiredAmount);
    const percent = Number(prizePercent);
    const seats = Number(totalSeats);
    const knights = Number(requiredKnights);

    return (
      !!name.trim()
      && !!eventDate
      && !!desc.trim()
      && selected.length >= 5
      && selected.length <= 10
      && required > 0
      && percent >= 20
      && percent <= 50
      && seats > 0
      && knights > 0
    );
  }, [name, eventDate, desc, selected.length, requiredAmount, prizePercent, totalSeats, requiredKnights]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      nav('/login');
      return;
    }

    if (!validate()) return;

    setSaving(true);
    try {
      const created = await createTournament(token, {
        name: name.trim(),
        requiredAmount: Number(requiredAmount),
        description: desc.trim(),
        prizePercentNum: Number(prizePercent),
        eventDate, // LocalDate -> "YYYY-MM-DD"
        totalSeats: Number(totalSeats),
        requiredKnights: Number(requiredKnights),
        selectedLocationsIds: selected,
      });

      nav(`/tournaments/${created.id}`);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Не удалось создать турнир']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center gap-4">
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <span>←</span>
            Назад
          </Link>
          <h1 className="text-3xl font-semibold text-slate-900">Создание турнира</h1>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-8">
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Основная информация</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-700">Название турнира *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Великий Турнир в Честь Короля"
                    className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-700">Требуемая сумма (₽) *</label>
                    <input
                      type="number"
                      min={1}
                      value={requiredAmount}
                      onChange={(e) => setRequiredAmount(e.target.value)}
                      placeholder="100000"
                      className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-700">Призовой фонд (%) *</label>
                    <input
                      type="number"
                      min={20}
                      max={50}
                      value={prizePercent}
                      onChange={(e) => setPrizePercent(e.target.value)}
                      placeholder="30"
                      className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-xs text-slate-500 mt-1">От 20% до 50%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-700">Дата проведения *</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-700">Места для зрителей *</label>
                    <input
                      type="number"
                      min={1}
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(e.target.value)}
                      placeholder="200"
                      className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-700">Места для рыцарей *</label>
                    <input
                      type="number"
                      min={1}
                      value={requiredKnights}
                      onChange={(e) => setRequiredKnights(e.target.value)}
                      placeholder="16"
                      className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="text-xs text-slate-500 mt-1">Сколько заявок рыцарей нужно для турнира</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-700">Описание турнира *</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    placeholder="Грандиозный рыцарский турнир с участием лучших воинов королевства"
                    className="w-full mt-1 rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Планируемые площадки *</h2>
              <p className="text-sm text-slate-600 mb-4">Выберите от 5 до 10 возможных мест проведения турнира</p>

              {loadingLocations ? (
                <div className="text-sm text-slate-600">Загрузка локаций...</div>
              ) : locations.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Нет доступных локаций для выбора. Добавь записи в таблицу <span className="font-mono">location</span> в базе данных.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                        selected.includes(loc.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => toggleLocation(loc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(loc.id)}
                        onChange={() => toggleLocation(loc.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{loc.name}</div>
                        <div className="text-xs text-slate-600">{loc.address}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-600 mt-2">Выбрано: {selected.length} из 10</p>
            </div>

            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t">
              <Link
                to="/tournaments"
                className="flex-1 text-center px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
              >
                Отменить
              </Link>
              <button
                type="submit"
                disabled={!isFormValid || saving}
                className={`flex-1 px-4 py-2 rounded-xl text-white ${
                  !isFormValid || saving ? 'bg-green-600 opacity-60 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {saving ? 'Создание...' : 'Создать турнир'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTournament;
