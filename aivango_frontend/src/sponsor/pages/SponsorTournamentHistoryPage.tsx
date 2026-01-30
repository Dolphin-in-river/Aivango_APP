import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';

export default function SponsorTournamentHistoryPage() {
  const nav = useNavigate();
  const { tournaments } = useSponsorDemo();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');

  const venues = useMemo(() => Array.from(new Set(tournaments.map((t) => t.venue))), [tournaments]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch =
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.venue.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
      const matchesVenue = venueFilter === 'all' || tournament.venue === venueFilter;

      return matchesSearch && matchesStatus && matchesVenue;
    });
  }, [tournaments, searchQuery, statusFilter, venueFilter]);

  const sortedTournaments = useMemo(() => {
    return [...filteredTournaments].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredTournaments, dateSort]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REGISTRATION':
        return 'bg-blue-100 text-blue-800';
      case 'TICKET_SALES':
        return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'Сбор средств';
      case 'REGISTRATION':
        return 'Регистрация';
      case 'TICKET_SALES':
        return 'Продажа билетов';
      case 'IN_PROGRESS':
        return 'Проводится';
      case 'COMPLETED':
        return 'Завершён';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">История турниров</h1>
        <p className="text-slate-600">Поиск и просмотр турниров с фильтрацией и отчётами</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-slate-700 mb-2 text-sm">Поиск</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или месту..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2 text-sm">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="CREATED">Сбор средств</option>
              <option value="REGISTRATION">Регистрация</option>
              <option value="TICKET_SALES">Продажа билетов</option>
              <option value="IN_PROGRESS">Проводится</option>
              <option value="COMPLETED">Завершён</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-2 text-sm">Место</label>
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все места</option>
              {venues.map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-sm text-slate-600">Найдено турниров: {sortedTournaments.length}</div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Сортировка по дате:</span>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">От новых к старым</option>
              <option value="asc">От старых к новым</option>
            </select>
          </div>
        </div>
      </div>

      {sortedTournaments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-slate-700 mb-2 font-semibold">Турниры не найдены</h2>
          <p className="text-slate-500">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedTournaments.map((tournament) => (
            <div key={tournament.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-slate-900">{tournament.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(tournament.status)}`}>
                        {getStatusText(tournament.status)}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">{tournament.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="text-slate-700">{tournament.venue}</div>
                  <div className="text-slate-700">
                    {new Date(tournament.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div>
                    <p className="text-slate-600">Призовой фонд</p>
                    <p className="text-slate-900">{tournament.collectedAmount.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Прогресс сбора</p>
                    <p className="text-slate-900">{Math.round((tournament.collectedAmount / tournament.targetAmount) * 100)}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => nav(`/sponsor/tournaments/${tournament.id}`)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Просмотреть
                  </button>

                  {tournament.status === 'COMPLETED' && (
                    <button
                      onClick={() => nav(`/sponsor/organizer/reports/${tournament.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Отчёты
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
