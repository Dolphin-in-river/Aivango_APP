import { useNavigate } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';
import type { ApplicationStatus } from '../types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_TEXT: Record<ApplicationStatus, string> = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
};

export default function SponsorMyApplicationsPage() {
  const nav = useNavigate();
  const { applications, tournaments, currentKnight } = useSponsorDemo();

  const myApps = applications.filter((a) => a.knightId === currentKnight.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => nav('/sponsor/knight/tournaments')} className="text-slate-600 hover:text-slate-900 mb-6 transition-colors">
        Назад к турнирам
      </button>

      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Мои заявки на турниры</h1>
        <p className="text-slate-600">Отслеживание статусов заявок на участие</p>
      </div>

      {myApps.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-slate-700 mb-2">Заявок пока нет</h2>
          <p className="text-slate-500 mb-6">Можно подать заявку на участие в турнире с открытой регистрацией</p>
          <button onClick={() => nav('/sponsor/knight/tournaments')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Выбрать турнир
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myApps.map((application) => {
            const tournament = tournaments.find((t) => t.id === application.tournamentId);
            if (!tournament) return null;

            return (
              <div key={application.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="mb-1 text-lg font-semibold text-slate-900">{tournament.name}</h2>
                      <p className="text-sm text-slate-600">{tournament.venue}</p>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${STATUS_COLORS[application.status]}`}>
                      {STATUS_TEXT[application.status]}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Дата турнира</p>
                      <p className="text-slate-900">
                        {new Date(tournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-600 mb-1">Подана</p>
                      <p className="text-slate-900">
                        {new Date(application.submittedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-600 mb-1">Номер заявки</p>
                      <p className="text-slate-900 font-mono text-xs">{application.id}</p>
                    </div>

                    {application.reviewedAt && (
                      <div>
                        <p className="text-slate-600 mb-1">Рассмотрена</p>
                        <p className="text-slate-900">
                          {new Date(application.reviewedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>

                  {application.status === 'APPROVED' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h3 className="text-green-900 mb-2 font-semibold">Заявка одобрена</h3>
                      <p className="text-sm text-green-800 mb-3">
                        Заявка одобрена. Остаётся прибыть в назначенное время.
                      </p>
                      {application.reviewComment && (
                        <div className="text-sm">
                          <p className="text-green-700 mb-1">Комментарий организатора:</p>
                          <p className="text-green-900 italic">"{application.reviewComment}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {application.status === 'REJECTED' && application.reviewComment && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h3 className="text-red-900 mb-2 font-semibold">Причина отклонения</h3>
                      <p className="text-sm text-red-800 italic">"{application.reviewComment}"</p>
                    </div>
                  )}

                  {application.status === 'PENDING' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        Заявка находится на рассмотрении. Уведомление о статусе придёт на email после решения организатора.
                      </p>
                    </div>
                  )}

                  <button onClick={() => nav(`/sponsor/tournaments/${tournament.id}`)} className="text-blue-600 hover:text-blue-700 text-sm">
                    Просмотреть турнир
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
