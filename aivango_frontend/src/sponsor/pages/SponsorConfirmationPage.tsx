import { useNavigate, useParams } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';

export default function SponsorConfirmationPage() {
  const nav = useNavigate();
  const { sponsorshipId } = useParams();
  const { getSponsorshipById, getTournamentById } = useSponsorDemo();

  const sponsorship = sponsorshipId ? getSponsorshipById(sponsorshipId) : undefined;
  const tournament = sponsorship ? getTournamentById(sponsorship.tournamentId) : undefined;

  if (!sponsorship || !tournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-slate-700">Данные не найдены</p>
        <button className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => nav('/sponsor/tournaments')}>
          К списку турниров
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
            <h1 className="mb-2 text-2xl font-semibold">Спасибо за вклад</h1>
            <p className="text-green-100 text-lg">Взнос успешно обработан</p>
          </div>

          <div className="p-8">
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Детали спонсорства</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">ID взноса:</span>
                  <span className="text-slate-900">{sponsorship.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Компания:</span>
                  <span className="text-slate-900">{sponsorship.companyName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Пакет:</span>
                  <span className="text-slate-900">{sponsorship.package}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Сумма:</span>
                  <span className="text-slate-900">{sponsorship.amount.toLocaleString('ru-RU')} ₽</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Турнир:</span>
                  <span className="text-slate-900">{tournament.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Место проведения:</span>
                  <span className="text-slate-900">{sponsorship.venue}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Дата:</span>
                  <span className="text-slate-900">
                    {new Date(sponsorship.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Статус:</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {sponsorship.status === 'CONFIRMED' ? 'Подтверждено' : 'В обработке'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="mb-1 text-blue-900 font-semibold">Подтверждение отправлено</h3>
              <p className="text-sm text-blue-800">
                Подробная информация о спонсорстве отправлена на email. Логотип отображается на странице турнира.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => nav(`/sponsor/tournaments/${tournament.id}`)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Посмотреть страницу турнира
              </button>

              <button
                onClick={() => nav('/sponsor/tournaments')}
                className="w-full border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Вернуться к списку турниров
              </button>
            </div>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-slate-600">
                При возникновении вопросов обращаться по адресу{' '}
                <a href="mailto:support@tournament.ru" className="text-blue-600 hover:underline">
                  support@tournament.ru
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
