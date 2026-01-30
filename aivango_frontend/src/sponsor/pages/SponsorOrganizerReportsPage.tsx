import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';
import type { PrizeDistribution } from '../types';

type ReportType = 'financial' | 'attendance' | 'results';

export default function SponsorOrganizerReportsPage() {
  const nav = useNavigate();
  const { tournamentId } = useParams();
  const { tournaments, applications, sponsorships, getPrizeDistributionByTournamentId } = useSponsorDemo();
  const [selectedReport, setSelectedReport] = useState<ReportType>('financial');

  const tournament = tournaments.find((t) => t.id === tournamentId);
  const tournamentApplications = applications.filter((a) => a.tournamentId === tournamentId);
  const tournamentSponsorships = sponsorships.filter((s) => s.tournamentId === tournamentId);
  const prizeDistribution = tournamentId ? getPrizeDistributionByTournamentId(tournamentId) : undefined;

  const totalSponsorship = useMemo(
    () => tournamentSponsorships.reduce((sum, s) => sum + s.amount, 0),
    [tournamentSponsorships],
  );

  if (!tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-700">Турнир не найден</p>
        <button className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => nav('/sponsor/organizer/history')}>
          К истории турниров
        </button>
      </div>
    );
  }

  const renderFinancial = () => {
    const expenses = tournament.collectedAmount * 0.3;
    const netProfit = tournament.collectedAmount - expenses;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Доходы</h3>
            <p className="text-3xl text-green-900">{totalSponsorship.toLocaleString('ru-RU')} ₽</p>
            <p className="text-sm text-green-700 mt-1">от {tournamentSponsorships.length} спонсоров</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Расходы</h3>
            <p className="text-3xl text-red-900">{expenses.toLocaleString('ru-RU')} ₽</p>
            <p className="text-sm text-red-700 mt-1">организационные расходы</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Чистая прибыль</h3>
            <p className="text-3xl text-blue-900">{netProfit.toLocaleString('ru-RU')} ₽</p>
            <p className="text-sm text-blue-700 mt-1">после вычета расходов</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Спонсорские взносы по пакетам</h3>
          <div className="space-y-3">
            {['Platinum', 'Gold', 'Silver', 'Bronze'].map((packageType) => {
              const packageSponsors = tournamentSponsorships.filter((s) => s.package === packageType);
              const packageTotal = packageSponsors.reduce((sum, s) => sum + s.amount, 0);
              if (packageSponsors.length === 0) return null;

              return (
                <div key={packageType} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-slate-900">{packageType}</p>
                    <p className="text-sm text-slate-600">{packageSponsors.length} спонсоров</p>
                  </div>
                  <p className="text-slate-900">{packageTotal.toLocaleString('ru-RU')} ₽</p>
                </div>
              );
            })}
          </div>
        </div>

        {prizeDistribution && <PrizeDistributionCard prizeDistribution={prizeDistribution} />}
      </div>
    );
  };

  const renderAttendance = () => {
    const totalVisitors = 1250;
    const uniqueVisitors = 980;
    const peakAttendance = 450;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Всего посетителей</h3>
            <p className="text-3xl text-purple-900">{totalVisitors}</p>
            <p className="text-sm text-purple-700 mt-1">общее количество</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Уникальные</h3>
            <p className="text-3xl text-indigo-900">{uniqueVisitors}</p>
            <p className="text-sm text-indigo-700 mt-1">уникальных посетителей</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Пик посещаемости</h3>
            <p className="text-3xl text-cyan-900">{peakAttendance}</p>
            <p className="text-sm text-cyan-700 mt-1">во время финала</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Динамика посещаемости</h3>
          <div className="h-64 flex items-end gap-2">
            {[120, 180, 250, 320, 450, 380, 280, 190].map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${(value / 450) * 100}%` }} />
                <p className="text-xs text-slate-600">День {idx + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const approvedCount = tournamentApplications.filter((a) => a.status === 'APPROVED').length;
    const pendingCount = tournamentApplications.filter((a) => a.status === 'PENDING').length;
    const rejectedCount = tournamentApplications.filter((a) => a.status === 'REJECTED').length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Одобренные заявки</h3>
            <p className="text-3xl text-green-900">{approvedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">На рассмотрении</h3>
            <p className="text-3xl text-yellow-900">{pendingCount}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Отклонённые</h3>
            <p className="text-3xl text-red-900">{rejectedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Список участников</h3>
          <div className="space-y-2">
            {tournamentApplications.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Заявок пока нет</p>
            ) : (
              tournamentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-slate-900">{app.knightName}</p>
                    <p className="text-sm text-slate-600">Заявка #{app.id}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm ${
                      app.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {app.status === 'APPROVED' ? 'Одобрено' : app.status === 'PENDING' ? 'На рассмотрении' : 'Отклонено'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {prizeDistribution && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Победители турнира</h3>
            <div className="space-y-4">
              <WinnerRow place="1" name={prizeDistribution.first.knightName} amount={prizeDistribution.first.amount} />
              <WinnerRow place="2" name={prizeDistribution.second.knightName} amount={prizeDistribution.second.amount} />
              <WinnerRow place="3" name={prizeDistribution.third.knightName} amount={prizeDistribution.third.amount} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => nav('/sponsor/organizer/history')} className="text-slate-600 hover:text-slate-900 mb-6 transition-colors">
        Назад
      </button>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">Отчёты по турниру</h1>
            <h2 className="text-slate-600">{tournament.name}</h2>
          </div>
          <button
            onClick={() => window.alert('В демо версии экспорт недоступен')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Скачать PDF
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <TabButton active={selectedReport === 'financial'} onClick={() => setSelectedReport('financial')}>
            Финансы
          </TabButton>
          <TabButton active={selectedReport === 'attendance'} onClick={() => setSelectedReport('attendance')}>
            Посещаемость
          </TabButton>
          <TabButton active={selectedReport === 'results'} onClick={() => setSelectedReport('results')}>
            Результаты
          </TabButton>
        </div>
      </div>

      {selectedReport === 'financial' && renderFinancial()}
      {selectedReport === 'attendance' && renderAttendance()}
      {selectedReport === 'results' && renderResults()}
    </div>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      className={`px-4 py-3 border-b-2 transition-colors ${
        props.active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      {props.children}
    </button>
  );
}

function WinnerRow(props: { place: string; name: string; amount: number }) {
  const bg =
    props.place === '1'
      ? 'from-yellow-50 to-amber-50'
      : props.place === '2'
        ? 'from-slate-50 to-slate-100'
        : 'from-orange-50 to-orange-100';

  return (
    <div className={`flex items-center gap-4 p-4 bg-gradient-to-r ${bg} rounded-lg`}>
      <div className="text-2xl font-semibold text-slate-900">{props.place}</div>
      <div className="flex-1">
        <p className="text-lg text-slate-900">{props.name}</p>
        <p className="text-sm text-slate-600">{props.place} место</p>
      </div>
      <p className="text-lg text-slate-900">{props.amount.toLocaleString('ru-RU')} ₽</p>
    </div>
  );
}

function PrizeDistributionCard(props: { prizeDistribution: PrizeDistribution }) {
  const p = props.prizeDistribution;
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="mb-4 font-semibold text-slate-900">Распределение призового фонда</h3>
      <div className="space-y-3">
        <Row label={`1 место - ${p.first.knightName}`} subLabel="50% призового фонда" amount={p.first.amount} />
        <Row label={`2 место - ${p.second.knightName}`} subLabel="25% призового фонда" amount={p.second.amount} />
        <Row label={`3 место - ${p.third.knightName}`} subLabel="10% призового фонда" amount={p.third.amount} />
        <Row label={`Приз зрительских симпатий - ${p.audienceChoice.knightName}`} subLabel="5% призового фонда" amount={p.audienceChoice.amount} />
      </div>
    </div>
  );
}

function Row(props: { label: string; subLabel: string; amount: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-slate-900">{props.label}</p>
        <p className="text-sm text-slate-600">{props.subLabel}</p>
      </div>
      <p className="text-slate-900">{props.amount.toLocaleString('ru-RU')} ₽</p>
    </div>
  );
}
