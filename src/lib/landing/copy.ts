import type { Locale } from '@/lib/i18n/config'

/**
 * Marketing landing copy. Kept apart from the app dictionaries — this text
 * is long-form and changes with campaigns, not with UI.
 */

export interface LandingCopy {
  nav: { features: string; pricing: string; signIn: string; ctaShort: string }
  hero: {
    chips: string[]
    titleBefore: string
    titleAccent: string
    titleAfter: string
    lede: string
    cta: string
    ctaNote: string
    statNumber: string
    statText: string
    slotPay: string
    mockName: string
    mockTitle: string
  }
  strip: { label: string }
  products: {
    label: string
    titleBefore: string
    titleAccent: string
    lede: string
    items: { no: string; title: string; text: string; tagStrong: string; tagRest: string }[]
  }
  bento: {
    label: string
    titleBefore: string
    titleAccent: string
    cards: {
      selection: { label: string; text: string }
      galleryPhoto: string
      protection: { label: string; text: string }
      archive: { label: string; text: string }
      payments: { label: string; text: string }
      stats: { label: string; number: string; text: string }
      themes: { label: string; text: string; chips: string[] }
      previewPhoto: string
      autoRelease: { label: string; text: string }
      video: { label: string; text: string }
      email: { label: string; text: string }
    }
  }
  principles: {
    huge: string
    title: string
    lede: string
    items: { title: string; text: string }[]
  }
  pricing: {
    label: string
    titleBefore: string
    titleAccent: string
    lede: string
    freeName: string
    freePeriod: string
    freeNote: string
    freeItems: string[]
    freeCta: string
    startName: string
    startNote: string
    startItems: string[]
    startCta: string
    proName: string
    proNote: string
    proItems: string[]
    proCta: string
    perMonth: string
    yearHint: (year: string) => string
    storage: (gb: number) => string
    popular: string
    fineprint: string
  }
  faq: { label: string; title: string; items: { q: string; a: string }[] }
  final: { label: string; titleBefore: string; titleAccent: string; cta: string }
  footer: { tagline: string; links: string }
}

const uk: LandingCopy = {
  nav: { features: 'Можливості', pricing: 'Тарифи', signIn: 'Увійти', ctaShort: 'Почати безкоштовно' },
  hero: {
    chips: ['Весілля', "Сім'ї", 'Портрети', 'Студії'],
    titleBefore: 'Все, що стається ',
    titleAccent: 'після',
    titleAfter: ' кнопки затвора',
    lede:
      'Галереї для передавання зйомок, персональний сайт за вечір і бронювання з оплатою напряму на вашу картку. Один кабінет — і скрізь лише ваш бренд.',
    cta: 'Почати безкоштовно',
    ctaNote: '3 ГБ назавжди безкоштовно. Без картки при реєстрації.',
    statNumber: '120 000',
    statText: 'фотографій передано клієнтам через галереї «Прояву»',
    slotPay: 'Оплатити фотографу',
    mockName: 'Олена Романюк',
    mockTitle: 'Весільні історії',
  },
  strip: { label: 'Роботи фотографів' },
  products: {
    label: 'Три продукти · один кабінет',
    titleBefore: 'Кожен етап роботи з клієнтом — ',
    titleAccent: 'під вашим брендом',
    lede:
      'Починається все з галерей — саме там фотограф щотижня зустрічається з клієнтом. Сайт і бронювання підключаються, коли будете готові.',
    items: [
      {
        no: '01 — Галереї',
        title: 'Передавайте зйомки красиво',
        text: 'Завантажуєте фотографії — клієнт отримує посилання. Обране, пароль, термін дії, завантаження архівом, статистика переглядів.',
        tagStrong: 'Оригінали без стискання.',
        tagRest: ' Файли — як зняли',
      },
      {
        no: '02 — Сайти',
        title: 'Сайт-візитівка за вечір',
        text: 'Вісім готових тем — від редакційної «Тиші» до музейної «Галереї». Портфоліо збирається саме з ваших опублікованих зйомок.',
        tagStrong: 'Теми перемикаються',
        tagRest: ' без втрати контенту',
      },
      {
        no: '03 — Бронювання',
        title: 'Клієнт сам обирає час',
        text: 'І одразу оплачує — Monobank, WayForPay, банка чи реквізити. Двоє не заброюють один слот, неоплачені броні звільняються самі.',
        tagStrong: 'Гроші напряму вам.',
        tagRest: ' Ми не торкаємось платежів',
      },
    ],
  },
  bento: {
    label: 'Все в одному кабінеті',
    titleBefore: 'Дрібниці, з яких складається ',
    titleAccent: 'спокійна робота',
    cards: {
      selection: {
        label: 'Відбір',
        text: 'Клієнт сердечком позначає кадри на ретуш — список файлів експортується одним кліком',
      },
      galleryPhoto: 'Галерея',
      protection: { label: 'Захист', text: 'Пароль і термін дії на кожну галерею' },
      archive: { label: 'Архів', text: 'Все однією кнопкою — zip збирається без черг і очікувань' },
      payments: { label: 'Оплати', text: 'Напряму на вашу картку. Завжди.' },
      stats: { label: 'Статистика', number: '247', text: 'переглядів галереї цього тижня' },
      themes: {
        label: 'Теми сайту',
        text: 'Вісім характерів',
        chips: ['Тиша', 'Опівніч', 'Плівка', 'Журнал', 'Архів'],
      },
      previewPhoto: 'Превʼю без втрат швидкості',
      autoRelease: { label: 'Бронювання', text: 'Неоплачений слот звільняється сам через N годин' },
      video: {
        label: 'Великі відео',
        text: 'Завантаження частинами: обрив мережі на 95% коштує секунд, а не години',
      },
      email: { label: 'Пошта', text: 'Лист про нову бронь — одразу, з контактами клієнта' },
    },
  },
  principles: {
    huge: 'Принципи',
    title: 'Те, як платформа влаштована зсередини',
    lede: 'Це не список фіч — це рішення, які не переглядаються.',
    items: [
      {
        title: 'Нуль нашого брендингу',
        text: 'На галереях, сайтах і сторінках бронювання немає жодної згадки про нас. Клієнт бачить лише фотографа.',
      },
      {
        title: 'Гроші — напряму',
        text: 'Оплати за зйомки йдуть на ваш еквайринг чи картку. Платформа не тримає ваші гроші ні секунди.',
      },
      {
        title: 'Оригінали недоторканні',
        text: 'Файли зберігаються байт у байт. Клієнт переглядає швидкі превʼю, а завантажує повну якість.',
      },
      {
        title: 'Оплата = слово банку',
        text: 'Статус «оплачено» ставиться після перевірки в банку — ніколи зі слів клієнта чи неперевіреного вебхука.',
      },
    ],
  },
  pricing: {
    label: 'Тарифи · попередні, фіналізуються',
    titleBefore: 'Платите лише за місце — ',
    titleAccent: 'решта без обмежень',
    lede: 'Усі можливості доступні на кожному тарифі. Різниця тільки в обсязі сховища.',
    freeName: 'Безкоштовний',
    freePeriod: 'назавжди',
    freeNote: 'Для перших галерей і проби пера',
    freeItems: [
      'Галереї без обмежень за кількістю',
      'Сайт на будь-якій із восьми тем',
      'Бронювання з оплатою напряму',
    ],
    freeCta: 'Створити акаунт',
    startName: 'Старт',
    startNote: 'Місця вистачить на сезон активних зйомок',
    startItems: ['Все з безкоштовного', 'Місця на сезон активних зйомок', 'Пріоритетна підтримка'],
    startCta: 'Обрати Старт',
    proName: 'Про',
    proNote: 'Для студій і комерційних обсягів',
    proItems: ['Все зі Старту', 'Архів багатьох сезонів під рукою', 'Для студій і комерційних обсягів'],
    proCta: 'Обрати Про',
    perMonth: '/ місяць',
    yearHint: (year) => `або ${year} ₴ на рік — два місяці в подарунок`,
    storage: (gb) => `${gb} ГБ сховища`,
    popular: 'Найпопулярніший',
    fineprint:
      'Оплата карткою будь-якого українського банку. Скасувати можна будь-коли — файли лишаються, просто зупиняється завантаження нових, поки ви над лімітом.',
  },
  faq: {
    label: 'Питання, які ставлять найчастіше',
    title: 'Коротко про важливе',
    items: [
      {
        q: 'Чи бачать клієнти, що галерея зроблена на «Прояві»?',
        a: "Ні, і це принципова позиція. На публічних сторінках — лише ваше ім'я, ваш логотип і ваші фотографії. Клієнт вважає, що це ваш власний сайт, бо так воно і виглядає.",
      },
      {
        q: 'Через кого проходять гроші за зйомки?',
        a: 'Повз нас. Рахунок створюється на вашому еквайрингу Monobank чи WayForPay, ручні способи — це ваша банка чи картка. Ми лише показуємо клієнту кнопку і звіряємо статус оплати з банком.',
      },
      {
        q: 'Що станеться з файлами, якщо я скасую підписку?',
        a: 'Нічого страшного. Файли не видаляються — знижується лише ліміт, тож нові завантаження зупиняться, поки ви над ним. Завантажити своє ви можете завжди.',
      },
      {
        q: 'Чи стискаються мої фотографії?',
        a: 'Оригінали зберігаються байт у байт як завантажені. Для швидкого перегляду клієнт бачить згенеровані превʼю, але кнопка завантаження завжди віддає оригінал.',
      },
    ],
  },
  final: {
    label: 'Почніть із однієї галереї',
    titleBefore: 'Наступну зйомку віддайте клієнту ',
    titleAccent: 'красиво',
    cta: 'Створити безкоштовний акаунт',
  },
  footer: {
    tagline: 'Галереї · Сайти · Бронювання — для фотографів України',
    links: 'Умови · Приватність · Підтримка',
  },
}

const en: LandingCopy = {
  nav: { features: 'Features', pricing: 'Pricing', signIn: 'Sign in', ctaShort: 'Start for free' },
  hero: {
    chips: ['Weddings', 'Families', 'Portraits', 'Studios'],
    titleBefore: 'Everything that happens ',
    titleAccent: 'after',
    titleAfter: ' the shutter clicks',
    lede:
      'Galleries to deliver shoots, a personal site built in an evening, and bookings paid straight to your card. One dashboard — your brand everywhere.',
    cta: 'Start for free',
    ctaNote: '3 GB free forever. No card at sign-up.',
    statNumber: '120 000',
    statText: 'photos delivered to clients through Proyav galleries',
    slotPay: 'Pay the photographer',
    mockName: 'Olena Romaniuk',
    mockTitle: 'Wedding stories',
  },
  strip: { label: 'Photographers’ work' },
  products: {
    label: 'Three products · one dashboard',
    titleBefore: 'Every step of client work — ',
    titleAccent: 'under your brand',
    lede:
      'It all starts with galleries — that is where a photographer meets clients every week. The site and booking join in when you are ready.',
    items: [
      {
        no: '01 — Galleries',
        title: 'Deliver shoots beautifully',
        text: 'Upload the photos — the client gets a link. Favorites, password, expiry, zip download, view stats.',
        tagStrong: 'Originals uncompressed.',
        tagRest: ' Files exactly as shot',
      },
      {
        no: '02 — Sites',
        title: 'A personal site in an evening',
        text: 'Eight ready themes — from the editorial Tysha to the museum-like Galereia. The portfolio assembles from your published shoots.',
        tagStrong: 'Themes switch',
        tagRest: ' without losing content',
      },
      {
        no: '03 — Booking',
        title: 'Clients pick their own time',
        text: 'And pay right away — Monobank, WayForPay, a jar or requisites. No double-booking, unpaid holds release themselves.',
        tagStrong: 'Money goes straight to you.',
        tagRest: ' We never touch payments',
      },
    ],
  },
  bento: {
    label: 'All in one dashboard',
    titleBefore: 'The small things that make work ',
    titleAccent: 'calm',
    cards: {
      selection: {
        label: 'Selection',
        text: 'Clients heart the frames for retouching — export the file list in one click',
      },
      galleryPhoto: 'Gallery',
      protection: { label: 'Protection', text: 'Password and expiry on every gallery' },
      archive: { label: 'Archive', text: 'Everything in one click — the zip builds with no queues' },
      payments: { label: 'Payments', text: 'Straight to your card. Always.' },
      stats: { label: 'Stats', number: '247', text: 'gallery views this week' },
      themes: {
        label: 'Site themes',
        text: 'Eight characters',
        chips: ['Tysha', 'Opivnich', 'Plivka', 'Zhurnal', 'Arkhiv'],
      },
      previewPhoto: 'Previews with zero speed loss',
      autoRelease: { label: 'Booking', text: 'An unpaid slot frees itself after N hours' },
      video: {
        label: 'Large videos',
        text: 'Chunked uploads: a network drop at 95% costs seconds, not hours',
      },
      email: { label: 'Email', text: 'A new-booking email arrives instantly with client contacts' },
    },
  },
  principles: {
    huge: 'Principles',
    title: 'How the platform is built inside',
    lede: 'Not a feature list — decisions that do not get revisited.',
    items: [
      {
        title: 'Zero our branding',
        text: 'Galleries, sites and booking pages never mention us. The client sees only the photographer.',
      },
      {
        title: 'Money goes direct',
        text: 'Shoot payments land on your acquiring or card. The platform never holds your money for a second.',
      },
      {
        title: 'Originals are untouchable',
        text: 'Files are stored byte for byte. Clients browse fast previews and download full quality.',
      },
      {
        title: 'Payment = the bank’s word',
        text: 'The “paid” status is set after verifying with the bank — never from the client’s words or an unverified webhook.',
      },
    ],
  },
  pricing: {
    label: 'Pricing · preliminary, being finalized',
    titleBefore: 'Pay only for storage — ',
    titleAccent: 'everything else is unlimited',
    lede: 'All features on every plan. The only difference is storage size.',
    freeName: 'Free',
    freePeriod: 'forever',
    freeNote: 'For your first galleries',
    freeItems: ['Unlimited number of galleries', 'A site on any of eight themes', 'Booking with direct payment'],
    freeCta: 'Create account',
    startName: 'Start',
    startNote: 'Enough room for a busy season',
    startItems: ['Everything in Free', 'Room for a season of shoots', 'Priority support'],
    startCta: 'Choose Start',
    proName: 'Pro',
    proNote: 'For studios and commercial volumes',
    proItems: ['Everything in Start', 'Seasons of archive at hand', 'For studios and commercial volumes'],
    proCta: 'Choose Pro',
    perMonth: '/ month',
    yearHint: (year) => `or ${year} ₴ per year — two months free`,
    storage: (gb) => `${gb} GB of storage`,
    popular: 'Most popular',
    fineprint:
      'Pay with any Ukrainian bank card. Cancel anytime — files stay; new uploads pause while you are over the limit.',
  },
  faq: {
    label: 'Frequently asked',
    title: 'The important bits, briefly',
    items: [
      {
        q: 'Do clients see the gallery is made on Proyav?',
        a: 'No — a matter of principle. Public pages carry only your name, your logo and your photos. Clients assume it is your own site, because that is how it looks.',
      },
      {
        q: 'Who do shoot payments go through?',
        a: 'Past us. Invoices are created on your own Monobank or WayForPay merchant; manual methods are your jar or card. We only show the button and verify the status with the bank.',
      },
      {
        q: 'What happens to files if I cancel?',
        a: 'Nothing scary. Files are not deleted — only the limit drops, so new uploads pause while you are over it. You can always download what is yours.',
      },
      {
        q: 'Are my photos compressed?',
        a: 'Originals are stored byte for byte. Clients browse generated previews, but the download button always serves the original.',
      },
    ],
  },
  final: {
    label: 'Start with one gallery',
    titleBefore: 'Deliver your next shoot ',
    titleAccent: 'beautifully',
    cta: 'Create a free account',
  },
  footer: {
    tagline: 'Galleries · Sites · Booking — for photographers in Ukraine',
    links: 'Terms · Privacy · Support',
  },
}

export function getLandingCopy(locale: Locale): LandingCopy {
  return locale === 'en' ? en : uk
}
