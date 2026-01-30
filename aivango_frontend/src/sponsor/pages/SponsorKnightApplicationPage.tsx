import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';

export default function SponsorKnightApplicationPage() {
  const nav = useNavigate();
  const { tournamentId } = useParams();
  const { tournaments, currentKnight, submitKnightApplication } = useSponsorDemo();
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [error, setError] = useState('');

  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-700">Турнир не найден</p>
        <button className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => nav('/sponsor/knight/tournaments')}>
          К списку турниров
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToRules) {
      setError('Необходимо согласие с правилами турнира');
      return;
    }

    try {
      submitKnightApplication(tournament.id);
      nav('/sponsor/knight/applications');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => nav('/sponsor/knight/tournaments')}
          className="text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          Назад к списку турниров
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Заявка на турнир</h1>
            <h2 className="text-slate-600 mt-1">{tournament.name}</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="mb-3 font-semibold text-slate-900">Информация о турнире</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Место проведения:</span>
                <span className="text-slate-900">{tournament.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Дата:</span>
                <span className="text-slate-900">
                  {new Date(tournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Призовой фонд:</span>
                <span className="text-slate-900">{tournament.collectedAmount.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>

          {tournament.requirements && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-green-900 mb-2 font-semibold">Требования турнира</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>Минимум {tournament.requirements.minVictories} побед</li>
                {tournament.requirements.minExperience && <li>Минимум {tournament.requirements.minExperience} лет опыта</li>}
                {tournament.requirements.weightCategory && <li>Весовая категория: {tournament.requirements.weightCategory}</li>}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="mb-4 font-semibold text-slate-900">Данные</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Имя рыцаря</label>
                  <input
                    type="text"
                    value={currentKnight.name}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Рост (см)</label>
                  <input
                    type="number"
                    value={currentKnight.height}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Вес (кг)</label>
                  <input
                    type="number"
                    value={currentKnight.weight}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Побед</label>
                  <input
                    type="number"
                    value={currentKnight.victories}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Опыт (лет)</label>
                  <input
                    type="number"
                    value={currentKnight.experience}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-800">
                <p className="mb-2">После подачи заявки:</p>
                <ul className="space-y-1">
                  <li>Заявка будет рассмотрена организатором</li>
                  <li>Уведомление о статусе придёт на email</li>
                  <li>Статус можно отслеживать в разделе "Мои заявки"</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Согласие с правилами турнира и подтверждение достоверности данных.
                </span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => nav('/sponsor/knight/tournaments')}
                className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                disabled={!agreedToRules}
              >
                Отправить заявку
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
