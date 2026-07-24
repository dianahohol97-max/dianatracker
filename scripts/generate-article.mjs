#!/usr/bin/env node
/**
 * Content engine: writes ONE blog article from the next queued topic.
 *
 *   node scripts/generate-article.mjs
 *
 * Reads content/blog/topics.json, takes the first topic with status "todo",
 * asks Gemini to write the article as JSON (matching the blog's Block schema),
 * validates it, writes content/blog/generated/<slug>.json, and marks the topic
 * done. On a schedule (see .github/workflows/blog-generate.yml) it opens a PR
 * you approve — nothing publishes without your click.
 *
 * Env:
 *   GEMINI_API_KEY  (required)
 *   GEMINI_MODEL    (optional, default "gemini-2.5-flash")
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const TOPICS_FILE = path.join(ROOT, 'content', 'blog', 'topics.json')
const OUT_DIR = path.join(ROOT, 'content', 'blog', 'generated')

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

if (!API_KEY) fail('GEMINI_API_KEY is not set')

const topicsDoc = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'))
const topics = Array.isArray(topicsDoc.topics) ? topicsDoc.topics : []
const topic = topics.find((t) => t.status !== 'done')
if (!topic) {
  console.log('No pending topics — nothing to do. Add topics to content/blog/topics.json.')
  process.exit(0)
}

const today = new Date().toISOString().slice(0, 10)

const PROMPT = `Ти — україномовний контент-редактор бренду «проЯв» (proiav.space), SaaS для фотографів: клієнтські онлайн-галереї + персональні сайти + бронювання. Напиши ОДНУ SEO-статтю українською.

ФАКТИ ПРО ПРОДУКТ (згадуй природно, не рекламно):
- Freemium: безкоштовно 3 ГБ; тарифи Базовий 79₴/міс (100 ГБ), Плюс 319₴ (500 ГБ), Максимальний 559₴ (1 ТБ); сайти — окремий тариф. Річна оплата = 2 місяці безкоштовно.
- Клієнтські галереї: захист паролем, відбір/вподобайки клієнтом, завантаження оригіналів, водяний знак, термін дії.
- Оплати напряму фотографу (Monobank/картки). Нуль брендингу платформи на платних тарифах.
- Персональний сайт фотографа за вечір (власний домен, SEO). Бронювання зі слотами.

ТОН: на «ти», тепло, експертно, як досвідчений колега. Спершу користь, продукт — природно в контексті. Українською як носій (не калька). Без вигаданої статистики.

ТЕМА СТАТТІ:
- Заголовок (title): «${topic.title}»
- Цільовий пошуковий запит (має природно бути в title і в першому абзаці): «${topic.query}»
- Кут подачі: ${topic.angle}
- slug (НЕ змінюй): "${topic.slug}"

ВИМОГИ: 550–850 слів; 3–5 H2-підзаголовків; щонайменше один список; наприкінці РІВНО один заклик до дії (cta) на реєстрацію.

Поверни ЛИШЕ валідний JSON-об'єкт (без markdown, без пояснень) такої форми:
{
  "slug": "${topic.slug}",
  "title": "${topic.title}",
  "description": "…",            // мета-опис до 155 символів
  "readingMinutes": 5,
  "tags": ["…","…"],
  "body": [
    {"type":"p","text":"…"},
    {"type":"h2","text":"…"},
    {"type":"ul","items":["…","…"]},
    {"type":"cta","text":"Спробувати проЯв безкоштовно","href":"/uk/login"}
  ]
}
Дозволені типи блоків: "p", "h2", "ul" (з items[]), "cta" (з text і href). Перший блок — "p". Останній блок — рівно один "cta".`

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: PROMPT }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
  }),
})

if (!response.ok) {
  fail(`Gemini API ${response.status}: ${(await response.text()).slice(0, 500)}`)
}

const data = await response.json()
const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
if (!text) fail('Empty response from Gemini')

let article
try {
  // Strip an accidental code fence, just in case.
  article = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/, '').trim())
} catch (error) {
  fail(`Model did not return valid JSON: ${error.message}\n---\n${text.slice(0, 500)}`)
}

/* ---- validate against the Block schema ---- */
const isBlock = (b) =>
  b &&
  typeof b === 'object' &&
  ((b.type === 'p' && typeof b.text === 'string') ||
    (b.type === 'h2' && typeof b.text === 'string') ||
    (b.type === 'cta' && typeof b.text === 'string' && typeof b.href === 'string') ||
    (b.type === 'ul' && Array.isArray(b.items) && b.items.every((i) => typeof i === 'string')))

const valid =
  article &&
  typeof article.title === 'string' &&
  typeof article.description === 'string' &&
  Array.isArray(article.tags) &&
  Array.isArray(article.body) &&
  article.body.length >= 4 &&
  article.body.every(isBlock) &&
  article.body.filter((b) => b.type === 'cta').length === 1

if (!valid) fail('Generated article failed schema validation')

// Force the stable slug + today's date; clamp reading time.
article.slug = topic.slug
article.date = today
article.readingMinutes =
  typeof article.readingMinutes === 'number' ? article.readingMinutes : 5

fs.mkdirSync(OUT_DIR, { recursive: true })
const outFile = path.join(OUT_DIR, `${topic.slug}.json`)
fs.writeFileSync(outFile, JSON.stringify(article, null, 2) + '\n')

// Mark the topic done so the next run picks a fresh one.
topic.status = 'done'
fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsDoc, null, 2) + '\n')

console.log(`✓ Wrote ${path.relative(ROOT, outFile)} (topic: ${topic.query})`)
// Expose the slug to the GitHub Action (for the PR title/branch).
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${topic.slug}\ntitle=${article.title}\n`)
}
