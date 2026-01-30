import { useNavigate } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';

export default function SponsorKnightTournamentsPage() {
  const nav = useNavigate();
  const { tournaments, currentKnight } = useSponsorDemo();

  const openTournaments = tournaments.filter((t) => t.status === 'REGISTRATION');

  const checkRequirements = (tournament: typeof openTournaments[number]) => {
    if (!tournament.requirements) return { meets: true, issues: [] as string[] };

    const issues: string[] = [];

    if (currentKnight.victories < tournament.requirements.minVictories) {
      issues.push(`Требуется минимум ${tournament.requirements.minVictories} побед (у вас: ${currentKnight.victories})`);
    }

    if (tournament.requirements.minExperience && currentKnight.experience < tournament.requirements.minExperience) {
      issues.push(`Требуется минимум ${tournament.requirements.minExperience} лет опыта (у вас: ${currentKnight.experience})`);
    }

    return { meets: issues.length === 0, issues };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">Турниры с открытой регистрацией</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="mb-2 font-semibold text-slate-900">Профиль</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Имя</p>
              <p className="text-slate-900">{currentKnight.name}</p>
            </div>
            <div>
              <p className="text-slate-600">Побед</p>
              <p className="text-slate-900">{currentKnight.victories}</p>
            </div>
            <div>
              <p className="text-slate-600">Опыт</p>
              <p className="text-slate-900">{currentKnight.experience} лет</p>
            </div>
            <div>
              <p className="text-slate-600">Вес</p>
              <p className="text-slate-900">{currentKnight.weight} кг</p>
            </div>
          </div>
        </div>
      </div>

      {openTournaments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">В данный момент нет турниров с открытой регистрацией</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {openTournaments.map((tournament) => {
            const requirements = checkRequirements(tournament);

            return (
              <div key={tournament.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`h-2 ${requirements.meets ? 'bg-green-500' : 'bg-red-500'}`} />

                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">{tournament.name}</h2>

                  <p className="text-slate-600 mb-4 line-clamp-2">{tournament.description}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="text-slate-700">{tournament.venue}</div>
                    <div className="text-slate-700">
                      {new Date(tournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  {tournament.requirements && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700 mb-2">Требования:</p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className={currentKnight.victories >= tournament.requirements!.minVictories ? 'text-green-600' : 'text-red-600'}>
                            {currentKnight.victories >= tournament.requirements!.minVictories ? 'OK' : 'X'}
                          </span>
                          Минимум {tournament.requirements.minVictories} побед
                        </li>

                        {tournament.requirements.minExperience && (
                          <li className="flex items-center gap-2">
                            <span className={currentKnight.experience >= tournament.requirements!.minExperience ? 'text-green-600' : 'text-red-600'}>
                              {currentKnight.experience >= tournament.requirements!.minExperience ? 'OK' : 'X'}
                            </span>
                            Минимум {tournament.requirements.minExperience} лет опыта
                          </li>
                        )}

                        {tournament.requirements.weightCategory && (
                          <li className="flex items-center gap-2">
                            <span className="text-slate-400">-</span>
                            {tournament.requirements.weightCategory}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => nav(`/sponsor/knight/tournaments/${tournament.id}/apply`)}
                    disabled={!requirements.meets}
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                      requirements.meets ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {requirements.meets ? 'Подать заявку' : 'Не соответствуете требованиям'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
