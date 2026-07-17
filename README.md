# Gallery SaaS — онлайн-галереї для фотографів (MVP, Phase 1)

Платформа для фотографів: галереї для передачі зйомок клієнтам (Phase 1),
конструктор сайтів (Phase 2), профіль-портфоліо (Phase 3). Модель продукту —
Pixover, естетика — Vigbo.

**Ключовий архітектурний принцип:** це egress-важкий медіа-продукт. Усе медіа
живе в Cloudflare R2 (нульовий egress) і передається напряму між браузером і
сховищем через presigned URLs. Supabase — тільки дані та авторизація. Vercel
ніколи не проксіює байти фотографій.

## Стек

- Next.js 14 (App Router), TypeScript strict, React Server Components
- Tailwind CSS + design tokens на CSS-змінних (`src/app/globals.css`)
- Supabase (Postgres + Auth + RLS) — дані й авторизація, НЕ медіа
- Cloudflare R2 за абстракцією `src/lib/storage/` (`StorageProvider` → `R2Provider`)
- i18n: `uk` (за замовчуванням) + `en`, роутинг `/uk/...`, `/en/...`

## Що вже працює (Phase 1, перший зріз)

- Вхід через magic link (Supabase Auth), автостворення профілю тригером
- Кабінет: список галерей, використання сховища, створення галереї
  (назва, опис, дата, пароль, термін дії)
- Завантаження фото/відео: браузер → R2 напряму через presigned PUT,
  паралельні аплоади з прогресом, перевірка квоти сховища
- Варіанти зображень (preview 2048px / thumb 512px) генеруються в браузері
  при завантаженні (`src/lib/images/variants.ts`) і йдуть тим самим
  presigned-шляхом; у перегляді галереї оригінал ніколи не віддається
- Публічна галерея за slug: RLS відкриває лише опубліковані й не прострочені
  галереї; опційний пароль через HMAC-cookie; лічильник переглядів
- Відбір фото клієнтом (favorites) без реєстрації — анонімний токен
  у httpOnly-cookie, оптимістичний toggle, лічильники в кабінеті
- «Завантажити оригінал» — redirect на короткоживучий presigned GET + подія
  `download` у статистиці
- «Завантажити всі фото архівом» — браузер тягне оригінали напряму з R2 і
  збирає zip локально (fflate, store-режим) — нуль egress через сервер
- Статистика в кабінеті: перегляди, завантаження, обране по кожному фото
- Видалення галереї: спочатку об'єкти в R2, потім рядок у БД
  (тригер повертає квоту)

## Локальний запуск

```bash
cp .env.example .env.local   # заповнити значення
npm install
npm run dev
```

### 1. Supabase

Створіть проєкт, застосуйте міграцію:

```bash
npx supabase link --project-ref YOUR_PROJECT
npx supabase db push          # застосує supabase/migrations/0001_phase1_galleries.sql
```

В Auth → URL Configuration додайте `http://localhost:3000/auth/callback`
(і продакшн-URL) до Redirect URLs.

### 2. Cloudflare R2

1. Створіть bucket (наприклад `gallery-media`) і API token з правами
   Object Read & Write на цей bucket.
2. Додайте CORS-правило на bucket (браузер робить PUT/GET напряму):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://YOUR_APP_DOMAIN"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Заповніть `R2_*` змінні в `.env.local`.

## Схема даних (Phase 1)

`supabase/migrations/0001_phase1_galleries.sql`:

| Таблиця | Призначення |
|---|---|
| `profiles` | Фотограф: план, ліміт/використання сховища (рахується тригерами) |
| `galleries` | Галерея: slug, пароль (scrypt-hash), термін дії, публікація, перегляди |
| `assets` | Метадані фото/відео; сам файл — в R2 за `r2_key`; `variants` — майбутні thumbnail/preview |
| `selections` | Відбір клієнта (favorite/retouch) за анонімним `client_token` |
| `gallery_events` | Події view/download для статистики |

Уся публічна видимість — через RLS: анонім бачить лише опубліковану,
не прострочену галерею та її асети. Пароль перевіряється в app-шарі
(HMAC-cookie `g_unlock_*`), хеш ніколи не потрапляє в props сторінки.

## Потік завантаження (критичний шлях)

```
браузер ── POST /api/uploads/presign ──► перевірка власника + квоти → presigned PUT URL
браузер ── PUT (файл) ────────────────► R2 напряму (XHR, прогрес)
браузер ── POST /api/uploads/complete ► рядок в assets (RLS), тригер оновлює квоту
```

Перегляд: сервер підписує короткоживучі GET URL (preview або оригінал,
поки немає пайплайна варіантів) — браузер тягне медіа напряму з R2.

## Наступні кроки (у порядку)

1. Watermark-опція для preview + серверний пайплайн варіантів
   (замінить браузерну генерацію; точка підключення CDN —
   `src/lib/images/loader.ts`)
2. Streaming-zip для дуже великих галерей (зараз архів збирається в пам'яті
   браузера) + resumable/multipart для великих відео
3. Розділ «Обране клієнта» з фільтром і експортом списку імен файлів
4. Оплати: LiqPay/Fondy за абстракцією `lib/payments/`, тіри сховища
5. Брендинг фотографа (лого) в публічній галереї
