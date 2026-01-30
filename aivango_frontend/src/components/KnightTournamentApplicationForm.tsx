import { useMemo, useState } from 'react';

type TournamentForForm = {
  name: string;
  date: string; // ISO date
  venue: string;
  collectedAmount: number;
};

export type KnightApplicationFormInitial = {
  firstName: string;
  lastName: string;
  height?: number | null;
  weight?: number | null;
  motivation?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  coatOfArmsUrl?: string | null;
};

export type KnightApplicationFormSubmit = {
  knightName: string;
  knightSurname: string;
  height?: number | null;
  weight?: number | null;
  motivation?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  coatOfArmsUrl?: string | null;
};

type Props = {
  tournament: TournamentForForm;
  initial: KnightApplicationFormInitial;
  onBack: () => void;
  onSubmit: (payload: KnightApplicationFormSubmit) => Promise<void>;
  onUploadCoatOfArms?: (file: File) => Promise<string>;
};

const Icon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </Icon>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </Icon>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Icon>
);

const toIntOrNull = (value: string): number | null => {
  const v = value.trim();
  if (v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
};

export default function KnightTournamentApplicationForm({
  tournament,
  initial,
  onBack,
  onSubmit,
  onUploadCoatOfArms,
}: Props) {
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCoa, setUploadingCoa] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [knightName, setKnightName] = useState(initial.firstName ?? '');
  const [knightSurname, setKnightSurname] = useState(initial.lastName ?? '');
  const [height, setHeight] = useState(initial.height == null ? '' : String(initial.height));
  const [weight, setWeight] = useState(initial.weight == null ? '' : String(initial.weight));
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? '');
  const [coatOfArmsUrl, setCoatOfArmsUrl] = useState(initial.coatOfArmsUrl ?? '');
  const [motivation, setMotivation] = useState(initial.motivation ?? '');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canSubmit = useMemo(() => {
    if (submitting || uploadingCoa) return false;
    if (!agreeToRules) return false;
    if (knightName.trim() === '') return false;
    if (knightSurname.trim() === '') return false;
    return true;
  }, [agreeToRules, knightName, knightSurname, submitting, uploadingCoa]);

  const handleUploadCoa = async (file: File) => {
    if (!onUploadCoatOfArms) {
      setError('Загрузка герба недоступна');
      return;
    }

    setUploadingCoa(true);
    setError('');

    try {
      const url = await onUploadCoatOfArms(file);
      setCoatOfArmsUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить герб');
    } finally {
      setUploadingCoa(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (knightName.trim() === '' || knightSurname.trim() === '') {
      setError('Заполните имя и фамилию');
      return;
    }

    if (!agreeToRules) {
      setError('Необходимо согласиться с правилами участия в турнире');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        knightName: knightName.trim(),
        knightSurname: knightSurname.trim(),
        height: toIntOrNull(height),
        weight: toIntOrNull(weight),
        motivation: motivation.trim() === '' ? null : motivation.trim(),
        birthDate: birthDate.trim() === '' ? null : birthDate.trim(),
        coatOfArmsUrl: coatOfArmsUrl.trim() === '' ? null : coatOfArmsUrl.trim(),
      });

      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить заявку');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Заявка подана!</h2>
            <p className="text-slate-600 mb-6">Ваша заявка на участие в турнире успешно отправлена.</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Вернуться к турниру
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <ShieldIcon className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Регистрация на турнир</h1>
                <p className="text-blue-100">Подайте заявку на участие в рыцарском турнире</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Информация о турнире</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Название:</span>
                  <span className="font-medium text-blue-900">{tournament.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Дата:</span>
                  <span className="font-medium text-blue-900">{formatDate(tournament.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Место:</span>
                  <span className="font-medium text-blue-900">{tournament.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Призовой фонд:</span>
                  <span className="font-medium text-blue-900">{tournament.collectedAmount.toLocaleString()} руб.</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Данные рыцаря</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={knightName}
                    onChange={(e) => setKnightName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    placeholder="Введите имя"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={knightSurname}
                    onChange={(e) => setKnightSurname(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    placeholder="Введите фамилию"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Рост (см)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    placeholder="Например, 180"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Вес (кг)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    placeholder="Например, 85"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Дата рождения</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">Формат: ГГГГ-ММ-ДД</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Цифровой герб</label>
                  <input
                    type="text"
                    value={coatOfArmsUrl}
                    onChange={(e) => setCoatOfArmsUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    placeholder="Например, /uploads/coa/..."
                  />

                  {onUploadCoatOfArms && (
                    <div className="mt-2">
                      <label className="block text-xs text-slate-600 mb-1">Загрузите файл (JPG, PNG, SVG)</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml"
                        disabled={uploadingCoa}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadCoa(file);
                          e.currentTarget.value = '';
                        }}
                        className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                      />
                      {uploadingCoa && <div className="text-xs text-slate-600 mt-1">Загрузка герба...</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Мотивация</label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 min-h-[110px]"
                placeholder="Почему хотите участвовать в турнире"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Важная информация</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    После подачи заявки организаторы рассмотрят вашу кандидатуру. В случае одобрения вы получите
                    подтверждение.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToRules}
                  onChange={(e) => setAgreeToRules(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="text-slate-900 font-medium">Я согласен с правилами участия в турнире</span>
                  <p className="text-slate-600 mt-1">
                    Подтверждаю, что ознакомлен с регламентом турнира и обязуюсь соблюдать все правила безопасности.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                canSubmit
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-slate-300 text-slate-600 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Отправка заявки...' : 'Подать заявку на участие'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
