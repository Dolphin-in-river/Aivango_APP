import { useNavigate, useParams } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';

const LOGO_SIZES: Record<'small' | 'medium' | 'large' | 'xlarge', string> = {
  small: 'w-20 h-20',
  medium: 'w-32 h-32',
  large: 'w-48 h-48',
  xlarge: 'w-64 h-64',
};

export default function SponsorTournamentPage() {
  const nav = useNavigate();
  const { tournamentId } = useParams();
  const { tournaments, sponsorships, getPrizeDistributionByTournamentId, userRole, calculatePrizes } = useSponsorDemo();

  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-700">Турнир не найден</p>
        <button className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => nav('/sponsor/tournaments')}>
          К списку турниров
        </button>
      </div>
    );
  }

  const tournamentSponsorships = sponsorships.filter((s) => s.tournamentId === tournament.id);
  const prizeDistribution = getPrizeDistributionByTournamentId(tournament.id);
  const progress = (tournament.collectedAmount / tournament.targetAmount) * 100;

  const platinumSponsors = tournamentSponsorships.filter((s) => s.package === 'Platinum');
  const goldSponsors = tournamentSponsorships.filter((s) => s.package === 'Gold');
  const silverSponsors = tournamentSponsorships.filter((s) => s.package === 'Silver');
  const bronzeSponsors = tournamentSponsorships.filter((s) => s.package === 'Bronze');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => nav('/sponsor/tournaments')} className="text-slate-600 hover:text-slate-900 mb-6 transition-colors">
          Назад к списку турниров
        </button>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-3">{tournament.name}</h1>
              <p className="text-blue-100 text-lg mb-4">{tournament.description}</p>

              <div className="flex flex-wrap gap-6">
                <div className="text-blue-100">{tournament.venue}</div>
                <div className="text-blue-100">
                  {new Date(tournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {tournament.status === 'CREATED' && (
              <button
                onClick={() => nav(`/sponsor/tournaments/${tournament.id}/packages`)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Стать спонсором
              </button>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span>Прогресс сбора средств</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-3 mb-2">
              <div className="bg-white rounded-full h-3 transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="flex justify-between text-sm text-blue-100">
              <span>Собрано: {tournament.collectedAmount.toLocaleString('ru-RU')} ₽</span>
              <span>Цель: {tournament.targetAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </div>

        {tournamentSponsorships.length > 0 ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Наши спонсоры</h2>
            </div>

            {platinumSponsors.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8">
                <h3 className="mb-6 text-purple-900 font-semibold">Platinum - Королевские меценаты</h3>
                <div className="flex flex-wrap justify-center gap-8">
                  {platinumSponsors.map((s) => (
                    <div key={s.id} className="text-center">
                      <div className="bg-white p-6 rounded-xl shadow-lg mb-3 hover:shadow-xl transition-shadow">
                        <img src={s.logoUrl} alt={s.companyName} className={`${LOGO_SIZES.xlarge} object-contain mx-auto`} />
                      </div>
                      <p className="text-slate-700">{s.companyName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {goldSponsors.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-8">
                <h3 className="mb-6 text-yellow-900 font-semibold">Gold - Знатные покровители</h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {goldSponsors.map((s) => (
                    <div key={s.id} className="text-center">
                      <div className="bg-white p-4 rounded-xl shadow-md mb-2 hover:shadow-lg transition-shadow">
                        <img src={s.logoUrl} alt={s.companyName} className={`${LOGO_SIZES.large} object-contain mx-auto`} />
                      </div>
                      <p className="text-sm text-slate-700">{s.companyName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {silverSponsors.length > 0 && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                <h3 className="mb-4 text-slate-700 font-semibold">Silver - Почётные гости</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {silverSponsors.map((s) => (
                    <div key={s.id} className="text-center">
                      <div className="bg-white p-3 rounded-lg shadow-sm mb-2 hover:shadow-md transition-shadow">
                        <img src={s.logoUrl} alt={s.companyName} className={`${LOGO_SIZES.medium} object-contain mx-auto`} />
                      </div>
                      <p className="text-xs text-slate-600">{s.companyName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bronzeSponsors.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <h3 className="mb-4 text-orange-900 font-semibold">Bronze - Поддерживающие</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {bronzeSponsors.map((s) => (
                    <div key={s.id} className="text-center">
                      <div className="bg-white p-2 rounded-lg shadow-sm mb-1 hover:shadow-md transition-shadow">
                        <img src={s.logoUrl} alt={s.companyName} className={`${LOGO_SIZES.small} object-contain mx-auto`} />
                      </div>
                      <p className="text-xs text-slate-600">{s.companyName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <h3 className="mb-2 text-slate-700 font-semibold">Пока нет спонсоров</h3>
            <p className="text-slate-500 mb-6">Становление первым спонсором даёт максимальную видимость логотипа.</p>
            {tournament.status === 'CREATED' && (
              <button
                onClick={() => nav(`/sponsor/tournaments/${tournament.id}/packages`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Стать спонсором
              </button>
            )}
          </div>
        )}

        {prizeDistribution && (
          <div className="bg-white rounded-xl shadow-md p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Распределение призового фонда</h2>
              {userRole === 'ORGANIZER' && !tournament.prizeCalculated && (
                <button
                  onClick={() => calculatePrizes(tournament.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Рассчитать призы
                </button>
              )}
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-semibold text-yellow-900">1</div>
                <div className="flex-1">
                  <p className="text-lg text-slate-900">{prizeDistribution.first.knightName}</p>
                  <p className="text-sm text-slate-600">1 место - 50% призового фонда</p>
                </div>
                <p className="text-2xl text-yellow-900">{prizeDistribution.first.amount.toLocaleString('ru-RU')} ₽</p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                <div className="text-2xl font-semibold text-slate-700">2</div>
                <div className="flex-1">
                  <p className="text-lg text-slate-900">{prizeDistribution.second.knightName}</p>
                  <p className="text-sm text-slate-600">2 место - 25% призового фонда</p>
                </div>
                <p className="text-2xl text-slate-700">{prizeDistribution.second.amount.toLocaleString('ru-RU')} ₽</p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="text-2xl font-semibold text-orange-900">3</div>
                <div className="flex-1">
                  <p className="text-lg text-slate-900">{prizeDistribution.third.knightName}</p>
                  <p className="text-sm text-slate-600">3 место - 10% призового фонда</p>
                </div>
                <p className="text-2xl text-orange-900">{prizeDistribution.third.amount.toLocaleString('ru-RU')} ₽</p>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-rose-100 rounded-lg border border-pink-200">
                <div className="text-sm font-semibold text-rose-900">Зрители</div>
                <div className="flex-1">
                  <p className="text-lg text-slate-900">{prizeDistribution.audienceChoice.knightName}</p>
                  <p className="text-sm text-slate-600">Приз зрительских симпатий - 5% призового фонда</p>
                </div>
                <p className="text-2xl text-rose-900">{prizeDistribution.audienceChoice.amount.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm text-slate-600">
              <p>Призы рассчитаны: {new Date(prizeDistribution.calculatedAt).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
