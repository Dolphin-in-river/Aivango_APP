import { useNavigate, useParams } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';
import type { PackageType } from '../types';

const PACKAGE_COLORS: Record<PackageType, string> = {
  Bronze: 'from-orange-700 to-orange-900',
  Silver: 'from-slate-400 to-slate-600',
  Gold: 'from-yellow-400 to-yellow-600',
  Platinum: 'from-purple-500 to-indigo-600',
};

export default function SponsorPackageSelectionPage() {
  const nav = useNavigate();
  const { tournamentId } = useParams();
  const { tournaments, sponsorPackages } = useSponsorDemo();

  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-700">Турнир не найден</p>
        <button
          className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          onClick={() => nav('/sponsor/tournaments')}
        >
          К списку турниров
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => nav('/sponsor/tournaments')}
          className="text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          Назад к турнирам
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Выбор пакета спонсорства</h1>
          <h2 className="text-slate-600 mb-1">{tournament.name}</h2>
          <p className="text-slate-500">
            {tournament.venue} •{' '}
            {new Date(tournament.date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {sponsorPackages.map((pkg) => {
            const isRecommended = pkg.type === 'Gold';
            return (
              <div
                key={pkg.type}
                className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden ${
                  isRecommended ? 'ring-2 ring-blue-500 relative' : ''
                }`}
              >
                {isRecommended && <div className="bg-blue-500 text-white text-center py-1 text-sm">Рекомендуем</div>}

                <div className={`bg-gradient-to-br ${PACKAGE_COLORS[pkg.type]} text-white p-6`}>
                  <div className="text-sm opacity-90 mb-2">Пакет</div>
                  <h3 className="mb-1 text-xl font-semibold">{pkg.type}</h3>
                  <div className="text-3xl font-semibold">{pkg.amount.toLocaleString('ru-RU')} ₽</div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-slate-600 mb-3">Преимущества:</p>
                    <ul className="space-y-2">
                      {pkg.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <span className="text-green-600">+</span>
                          <span className="text-slate-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => nav(`/sponsor/tournaments/${tournament.id}/sponsor-form/${pkg.type}`)}
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      isRecommended ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="mb-2 font-semibold text-slate-900">Как это работает</h3>
          <ul className="space-y-2 text-slate-700">
            <li className="flex gap-2">
              <span className="text-blue-600">1.</span>
              <span>Выбор пакета спонсорства</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">2.</span>
              <span>Заполнение информации о компании и загрузка логотипа</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">3.</span>
              <span>Логотип отображается на странице турнира</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">4.</span>
              <span>Подтверждение взноса и доступ к преимуществам</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
