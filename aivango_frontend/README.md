# Aivango Frontend

## Запуск

```bash
npm install
npm run dev
```

По умолчанию фронтенд обращается к API по `src/config.ts`.

## Что было сделано

Цель - перенести верстку и пользовательские сценарии из драфт проекта (Tailwind) в основной проект, не ломая существующую логику.

### 1) Турниры

- Полностью обновлен экран **/tournaments** (компонент `src/components/TournamentsList.tsx`) на Tailwind верстку.
- Добавлена страница **деталей турнира**: `/tournaments/:id` (`src/pages/TournamentDetailsPage.tsx`).
- Добавлены страницы действий:
  - **Регистрация рыцаря**: `/tournaments/:id/apply` (`src/pages/TournamentApplicationPage.tsx`)
  - **Покупка билета зрителем**: `/tournaments/:id/buy-ticket` (`src/pages/BuyTicketPage.tsx`)

Поскольку в текущем API нет полей даты турнира и продажи билетов, добавлены логичные заглушки:

- Дата турнира хранится локально в браузере (localStorage) и генерируется детерминированно для существующих турниров.
- Открытость регистрации и продажи билетов определяется из `tournamentStatus` плюс проверка по дате.
- Покупка билета пока без API - сохраняется локально (localStorage).

### 2) Создание турнира (роль Организатор)

- Экран **/create-tournament** (`src/components/CreateTournament.tsx`) переведен на Tailwind верстку и расширен:
  - Добавлено поле **дата проведения** (пока сохраняется локально, так как API его не принимает).
  - Добавлена проверка: **у организатора может быть только 1 открытый турнир** (заглушка на localStorage + проверка статуса по списку турниров).
  - Сохранены валидации:
    - 5-10 площадок
    - призовой фонд 20-50%

### 3) Исправление отправки заявки рыцаря

- В `src/components/KnightApplicationForm.tsx` исправлено формирование DTO:
  - ранее отправлялись **все** категории
  - теперь отправляются только выбранные пользователем

## Изменения в API запросах (то, что было затронуто)

### createTournament

- Endpoint: `POST /api/tournament`
- Было: форма отправляла поля `name`, `requiredAmount`, `description`, `prizePercentNum`, `selectedLocationsIds`
- Стало: запрос остался таким же (бэкенд не изменялся). Поле даты **не** отправляется в API, а сохраняется локально:
  - localStorage key: `aivango-tournament-meta`

### createKnightApplication

- Endpoint: `POST /api/knight-application`
- Было: `categories` заполнялось всеми id категорий, независимо от выбора
- Стало: `categories` заполняется строго выбранными id

## Важные localStorage ключи (заглушки)

- `aivango-tournament-meta` - локальная дата турнира (пока нет в API)
- `aivango-tickets` - покупки билетов (пока нет в API)
- `aivango-knight-applications` - факт отправки заявки рыцаря (пока нет получения "мои заявки" через API)
- `aivango-organizer-created-tournaments` - турниры, созданные текущим организатором (для проверки "1 открытый")
