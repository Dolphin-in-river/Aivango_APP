import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSponsorDemo } from '../SponsorDemoContext';
import type { PackageType } from '../types';

const VALID_FORMATS = ['image/png', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function SponsorFormPage() {
  const nav = useNavigate();
  const { tournamentId, packageType } = useParams();
  const { tournaments, sponsorPackages, createSponsorship } = useSponsorDemo();

  const tournament = tournaments.find((t) => t.id === tournamentId);
  const selectedPackage = sponsorPackages.find((p) => p.type === (packageType as PackageType));

  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [venue, setVenue] = useState(tournament?.venue ?? '');
  const [date, setDate] = useState(tournament?.date ?? '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!tournament || !selectedPackage) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-700">Данные не найдены</p>
        <button className="mt-4 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50" onClick={() => nav('/sponsor/tournaments')}>
          К списку турниров
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VALID_FORMATS.includes(file.type) || file.size > MAX_SIZE) {
      setError('Поддерживаются только PNG, SVG до 2 МБ');
      setLogoFile(null);
      return;
    }

    setError('');
    setLogoFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setError('Введите название компании');
      return;
    }

    if (!logoFile) {
      setError('Загрузите логотип компании');
      return;
    }

    if (!agreedToTerms) {
      setError('Необходимо согласие с условиями');
      return;
    }

    try {
      const { sponsorshipId } = createSponsorship({
        tournamentId: tournament.id,
        companyName,
        packageType: selectedPackage.type,
        amount: selectedPackage.amount,
        logoFile,
        venue,
        date,
      });
      nav(`/sponsor/confirmation/${sponsorshipId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => nav(`/sponsor/tournaments/${tournament.id}/packages`)}
          className="text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          Назад к выбору пакета
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Данные спонсора</h1>
            <p className="text-slate-600">Заполнение информации для оформления спонсорства</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Выбранный пакет</p>
                <p className="text-slate-900 font-semibold">{selectedPackage.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Сумма взноса</p>
                <p className="text-slate-900 font-semibold">{selectedPackage.amount.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-slate-700 mb-2">
                Название компании *
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='ООО "Ваша компания"'
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Герб или логотип * (PNG, SVG, до 2 МБ)</label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.svg,image/png,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {logoFile ? (
                  <div>
                    <p className="text-slate-900 mb-1">{logoFile.name}</p>
                    <p className="text-sm text-slate-500">{(logoFile.size / 1024).toFixed(0)} КБ</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-700 mb-1">Нажмите для загрузки герба или логотипа</p>
                    <p className="text-sm text-slate-500">PNG или SVG, максимум 2 МБ</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="venue" className="block text-slate-700 mb-2">
                Место проведения
              </label>
              <input
                type="text"
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-slate-700 mb-2">
                Дата проведения
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-t pt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Согласие с условиями спонсорства и подтверждение права представлять компанию. Логотип будет размещён на странице турнира после обработки взноса.
                </span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => nav('/sponsor/tournaments')}
                className="flex-1 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Внести взнос
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
