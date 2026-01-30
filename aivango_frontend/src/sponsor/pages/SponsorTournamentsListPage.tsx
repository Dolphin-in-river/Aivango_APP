import { useNavigate } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';

export default function SponsorTournamentsListPage() {
  const nav = useNavigate();
  const { tournaments } = useSponsorDemo();

  const activeTournaments = tournaments.filter((t) => t.status === 'CREATED');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Турниры, нуждающиеся в спонсорстве</h1>
        <p className="text-slate-600">
          Поддержка турниров и размещение логотипа на странице выбранного турнира
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeTournaments.map((tournament) => {
          const progress = (tournament.collectedAmount / tournament.targetAmount) * 100;
          const remaining = tournament.targetAmount - tournament.collectedAmount;

          return (
            <div
              key={tournament.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="h-2 bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">{tournament.name}</h2>

                <p className="text-slate-600 mb-4 line-clamp-2">{tournament.description}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-sm">{tournament.venue}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-sm">
                      {new Date(tournament.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="text-sm">Цель: {tournament.targetAmount.toLocaleString('ru-RU')} ₽</span>
                  </div>

                  <div className="flex items-center gap-2 text-green-600">
                    <span className="text-sm">Собрано: {tournament.collectedAmount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Прогресс</span>
                    <span className="text-slate-900">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="text-sm text-slate-500">Осталось собрать: {remaining.toLocaleString('ru-RU')} ₽</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => nav(`/sponsor/tournaments/${tournament.id}/packages`)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Стать спонсором
                  </button>
                  <button
                    onClick={() => nav(`/sponsor/tournaments/${tournament.id}`)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeTournaments.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500">В данный момент нет турниров, нуждающихся в спонсорстве</p>
        </div>
      )}
    </div>
  );
}
