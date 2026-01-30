import type { ChangeEvent, ChangeEventHandler } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../config';
import { getMyProfile, updateMyProfile, uploadCoatOfArms, UserProfileDTO } from '../apiProfile';
import { useAuth } from '../context/AuthContext';

type ProfileForm = {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  height: string;
  weight: string;
  motivation: string;
  coatOfArmsUrl: string;
};

const validateCoatFile = (file: File): string | null => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];

  if (file.size > maxSize) return 'Файл слишком большой. Максимум 5 МБ.';
  if (!allowedTypes.includes(file.type)) return 'Неверный формат. Допустимо: JPG, PNG, SVG.';
  return null;
};

const resolveCoatDownloadUrl = (pathOrUrl: string): string => {
  const raw = String(pathOrUrl ?? '').trim();
  if (!raw) return '';

  // Если бэкенд когда-то начнет возвращать полный URL
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  // Сейчас uploadCoatOfArms возвращает путь вида /uploads/coa/...
  if (raw.startsWith('/uploads/')) {
    return `${API_BASE_URL}/api/profile${raw}`;
  }
  if (raw.startsWith('uploads/')) {
    return `${API_BASE_URL}/api/profile/${raw}`;
  }

  // На всякий случай, если уже приходит /api/profile/...
  if (raw.startsWith('/api/')) {
    return `${API_BASE_URL}${raw}`;
  }

  // Фоллбек
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
};

const dtoToForm = (dto: UserProfileDTO, fallback?: { firstName?: string; lastName?: string }): ProfileForm => {
  return {
    firstName: String(dto.firstName ?? fallback?.firstName ?? '').trim(),
    lastName: String(dto.lastName ?? fallback?.lastName ?? '').trim(),
    birthDate: dto.birthDate ? String(dto.birthDate) : '',
    height: dto.height == null ? '' : String(dto.height),
    weight: dto.weight == null ? '' : String(dto.weight),
    motivation: dto.motivation == null ? '' : String(dto.motivation),
    coatOfArmsUrl: dto.coatOfArmsUrl == null ? '' : String(dto.coatOfArmsUrl),
  };
};

const formToDto = (form: ProfileForm): UserProfileDTO => {
  const toIntOrNull = (v: string) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    const i = Math.trunc(n);
    return i <= 0 ? null : i;
  };

  const birth = String(form.birthDate ?? '').trim();

  return {
    firstName: String(form.firstName ?? '').trim() || null,
    lastName: String(form.lastName ?? '').trim() || null,
    height: toIntOrNull(form.height),
    weight: toIntOrNull(form.weight),
    motivation: String(form.motivation ?? '').trim() || null,
    birthDate: birth || null,
    coatOfArmsUrl: String(form.coatOfArmsUrl ?? '').trim() || null,
  };
};

export default function MyProfile() {
  const { user, login } = useAuth();
  const nav = useNavigate();

  const token = user?.token ?? '';

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingCoat, setIsUploadingCoat] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [original, setOriginal] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm>(() =>
    dtoToForm({}, { firstName: user?.firstName, lastName: user?.lastName })
  );

  const isDirty = useMemo(() => {
    if (!original) return false;
    return (
      original.firstName !== form.firstName ||
      original.lastName !== form.lastName ||
      original.birthDate !== form.birthDate ||
      original.height !== form.height ||
      original.weight !== form.weight ||
      original.motivation !== form.motivation ||
      original.coatOfArmsUrl !== form.coatOfArmsUrl
    );
  }, [original, form]);

  const [coatBlobUrl, setCoatBlobUrl] = useState<string | null>(null);
  const coatBlobUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coatDownloadUrl = useMemo(() => {
    if (!form.coatOfArmsUrl) return '';
    return resolveCoatDownloadUrl(form.coatOfArmsUrl);
  }, [form.coatOfArmsUrl]);

  // Подгружаем профиль с бэкенда
  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      setInfo(null);
      setIsEditing(false);

      if (!token) {
        setIsLoading(false);
        setError('Не найден токен авторизации. Перелогиньтесь.');
        return;
      }

      try {
        setIsLoading(true);
        const dto = await getMyProfile(token);
        const next = dtoToForm(dto, { firstName: user?.firstName, lastName: user?.lastName });
        if (!mounted) return;
        setForm(next);
        setOriginal(next);
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : 'Не удалось загрузить профиль';
        setError(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Загружаем картинку герба через fetch с Authorization
  useEffect(() => {
    let cancelled = false;

    const revokePrev = () => {
      if (coatBlobUrlRef.current) {
        URL.revokeObjectURL(coatBlobUrlRef.current);
        coatBlobUrlRef.current = null;
      }
    };

    (async () => {
      revokePrev();
      setCoatBlobUrl(null);

      if (!token || !coatDownloadUrl) return;

      try {
        const res = await fetch(coatDownloadUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        coatBlobUrlRef.current = url;
        setCoatBlobUrl(url);
      } catch {
        // игнорируем, картинка не критична
      }
    })();

    return () => {
      cancelled = true;
      revokePrev();
    };
  }, [token, coatDownloadUrl]);

  const setField =
    (key: keyof ProfileForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
    };

  const onCancel = () => {
    setError(null);
    setInfo(null);
    if (original) setForm(original);
    setIsEditing(false);
  };

  const onToggleEdit = () => {
    setError(null);
    setInfo(null);

    // Если есть несохраненные изменения, считаем это отменой
    if (isEditing && isDirty) {
      if (original) setForm(original);
      setIsEditing(false);
      return;
    }

    // Если изменений нет - просто переключаем режим
    setIsEditing((v) => !v);
  };

  const onSave = async () => {
    setError(null);
    setInfo(null);

    if (!token) {
      setError('Не найден токен авторизации. Перелогиньтесь.');
      return;
    }

    const firstName = String(form.firstName ?? '').trim();
    const lastName = String(form.lastName ?? '').trim();
    if (!firstName || !lastName) {
      setError('Заполните обязательные поля: имя и фамилия.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = formToDto(form);
      const saved = await updateMyProfile(token, payload);
      const next = dtoToForm(saved, { firstName, lastName });
      setOriginal(next);
      setForm(next);
      setIsEditing(false);

      // Обновим отображаемое имя в хедере
      if (user) {
        login({ ...user, firstName, lastName });
      }

      setInfo('Профиль обновлен.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось обновить профиль';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const onCoatPick = () => {
    setError(null);
    setInfo(null);
    if (!isEditing) return;
    fileInputRef.current?.click();
  };

  const onCoatFileChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    setError(null);
    setInfo(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const err = validateCoatFile(file);
    if (err) {
      setError(err);
      e.target.value = '';
      return;
    }

    if (!token) {
      setError('Не найден токен авторизации. Перелогиньтесь.');
      e.target.value = '';
      return;
    }

    try {
      setIsUploadingCoat(true);

      // Локальный превью до ответа сервера
      if (coatBlobUrlRef.current) {
        URL.revokeObjectURL(coatBlobUrlRef.current);
        coatBlobUrlRef.current = null;
      }
      const localPreview = URL.createObjectURL(file);
      coatBlobUrlRef.current = localPreview;
      setCoatBlobUrl(localPreview);

      const path = await uploadCoatOfArms(token, file);
      const nextPath = String(path ?? '');
      setForm((p) => ({ ...p, coatOfArmsUrl: nextPath }));
      setOriginal((p) => (p ? { ...p, coatOfArmsUrl: nextPath } : p));
      setInfo('Герб загружен.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить герб';
      setError(msg);
    } finally {
      setIsUploadingCoat(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 border border-slate-300 bg-white rounded-lg px-4 py-2 text-sm font-medium text-slate-900"
          >
            <span aria-hidden="true">←</span>
            <span>Назад</span>
          </button>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-600"
                aria-hidden="true"
              >
                <path
                  d="M12 2L20 6V13C20 17.418 16.418 21 12 22C7.582 21 4 17.418 4 13V6L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <h1 className="text-3xl font-bold text-slate-900">Мой профиль</h1>
            </div>

            <button
              type="button"
              onClick={onToggleEdit}
              disabled={isLoading || isSaving || !token}
              className="inline-flex items-center justify-center border border-slate-300 bg-white rounded-lg px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
            >
              {isEditing ? (isDirty ? 'Отменить' : 'Готово') : 'Редактировать'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-red-600 bg-white rounded-lg p-4 text-sm text-slate-900">
            <div className="font-bold text-red-600">Ошибка</div>
            <div className="mt-2">{error}</div>
          </div>
        )}

        {info && (
          <div className="mb-6 border border-slate-200 bg-white rounded-lg p-4 text-sm text-slate-900">
            {info}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <h2 className="text-xl font-bold mb-4">Цифровой герб</h2>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 aspect-square flex flex-col items-center justify-center bg-slate-50">
                  {coatBlobUrl ? (
                    <img src={coatBlobUrl} alt="Герб" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-slate-400"
                          aria-hidden="true"
                        >
                          <path
                            d="M20 21V19C20 16.791 18.209 15 16 15H8C5.791 15 4 16.791 4 19V21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M12 11C14.209 11 16 9.209 16 7C16 4.791 14.209 3 12 3C9.791 3 8 4.791 8 7C8 9.209 9.791 11 12 11Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-500">Герб не загружен</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  className="hidden"
                  onChange={onCoatFileChange}
                />

                <button
                  type="button"
                  onClick={onCoatPick}
                  disabled={isUploadingCoat || isLoading || !isEditing}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-slate-300 bg-white rounded-lg px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
                >
                  <span>{isUploadingCoat ? 'Загрузка...' : 'Загрузить герб'}</span>
                </button>

                <p className="text-xs text-slate-500 mt-2">JPG, PNG или SVG, до 5 МБ</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Личные данные</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
                    <div>
                      <label className="text-sm font-medium">Имя *</label>
                      <input
                        value={form.firstName}
                        onChange={setField('firstName')}
                        disabled={isLoading || !isEditing}
                        className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Фамилия *</label>
                      <input
                        value={form.lastName}
                        onChange={setField('lastName')}
                        disabled={isLoading || !isEditing}
                        className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        value={user?.email ?? ''}
                        readOnly
                        className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Дата рождения</label>
                      <input
                        type="date"
                        value={form.birthDate}
                        onChange={setField('birthDate')}
                        disabled={isLoading || !isEditing}
                        className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">Данные профиля</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Рост (см)</label>
                      <input
                        value={form.height}
                        onChange={setField('height')}
                        placeholder="185"
                        disabled={isLoading || !isEditing}
                        inputMode="numeric"
                        className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Вес (кг)</label>
                      <input
                        value={form.weight}
                        onChange={setField('weight')}
                        placeholder="90"
                        disabled={isLoading || !isEditing}
                        inputMode="numeric"
                        className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium">Мотивация участия</label>
                    <textarea
                      value={form.motivation}
                      onChange={setField('motivation')}
                      placeholder="Почему вы хотите участвовать в турнирах?"
                      disabled={isLoading || !isEditing}
                      rows={4}
                      className="mt-1 w-full px-3 py-2 bg-slate-100 rounded-lg disabled:opacity-60"
                    />
                  </div>
                </div>

                {isEditing && isDirty && (
                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={isLoading || isSaving}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg disabled:opacity-60"
                    >
                      Отменить изменения
                    </button>

                    <button
                      type="button"
                      onClick={onSave}
                      disabled={isLoading || isSaving}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg disabled:opacity-60"
                    >
                      {isSaving ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                  </div>
                )}

                {isLoading && (
                  <p className="text-sm text-slate-500">Загружаем профиль...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
