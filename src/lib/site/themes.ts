import type { CSSProperties } from 'react'

/**
 * Phase 2 constructor: a theme is ONLY a set of token values — the blocks
 * (hero, portfolio, about, pricing, contact) are shared across all themes.
 * Switching a theme repaints and re-spaces the same content, never changes it.
 *
 * «Тиша» is the flagship; «Опівніч» is the same theme with mode: 'night'
 * (inverted tokens) — one click in the editor, zero re-layout.
 */

export const THEME_IDS = [
  'tysha',
  'povitria',
  'plivka',
  'zhurnal',
  'galereia',
  'arkhiv',
  'prodakshn',
] as const
export type ThemeId = (typeof THEME_IDS)[number]
export type SiteMode = 'light' | 'night'

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value)
}

const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const MONO = 'ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace'

export interface ThemeTokens {
  bg: string
  fg: string
  muted: string
  accent: string
  line: string
  fontDisplay: string
  fontBody: string
  fontLabel: string
  radius: string
  /** Display-heading treatment — themes differ here, blocks stay shared. */
  displayTransform: 'none' | 'uppercase'
  displayWeight: number
  displayTracking: string
}

interface ThemeDef {
  id: ThemeId
  tokens: ThemeTokens
  /** Only «Тиша» ships a night inversion for now. */
  night?: ThemeTokens
}

const base: Omit<ThemeTokens, 'bg' | 'fg' | 'muted' | 'accent' | 'line'> = {
  fontDisplay: SERIF,
  fontBody: SANS,
  fontLabel: SANS,
  radius: '0px',
  displayTransform: 'none',
  displayWeight: 400,
  displayTracking: '0',
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  tysha: {
    id: 'tysha',
    tokens: {
      ...base,
      bg: '#f2f1ed', fg: '#161513', muted: '#8a8781', accent: '#161513', line: '#dedcd5',
      fontLabel: MONO,
    },
    night: {
      ...base,
      bg: '#1b1a18', fg: '#ece8e0', muted: '#807b72', accent: '#ece8e0', line: '#2b2a27',
      fontLabel: MONO,
    },
  },
  povitria: {
    id: 'povitria',
    tokens: {
      ...base,
      bg: '#fdfcfa', fg: '#1b1a1f', muted: '#8f8c94', accent: '#1b1a1f', line: '#e8e5df',
    },
  },
  plivka: {
    id: 'plivka',
    tokens: {
      ...base,
      bg: '#f2efe6', fg: '#232a20', muted: '#6f7565', accent: '#c47a2e', line: '#ddd8c8',
      fontDisplay: 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
      fontLabel: MONO,
    },
  },
  zhurnal: {
    id: 'zhurnal',
    tokens: {
      ...base,
      bg: '#fffdf8', fg: '#26242a', muted: '#8f8b90', accent: '#26242a', line: '#e9e5dd',
    },
  },
  galereia: {
    id: 'galereia',
    tokens: {
      ...base,
      bg: '#ffffff', fg: '#111114', muted: '#86868c', accent: '#c8331f', line: '#e9e9ec',
      fontDisplay: HELV, fontBody: HELV,
      displayTransform: 'uppercase', displayWeight: 700, displayTracking: '-0.02em',
    },
  },
  arkhiv: {
    id: 'arkhiv',
    tokens: {
      ...base,
      bg: '#f5f2ea', fg: '#211f1c', muted: '#8c877c', accent: '#211f1c', line: '#dbd6c8',
      fontBody: SERIF, fontLabel: SERIF,
    },
  },
  prodakshn: {
    id: 'prodakshn',
    tokens: {
      ...base,
      bg: '#f1f1f0', fg: '#0e0e0e', muted: '#6d6d6b', accent: '#0e0e0e', line: '#0e0e0e',
      fontDisplay: HELV, fontBody: HELV,
      displayTransform: 'uppercase', displayWeight: 700, displayTracking: '-0.01em',
    },
  },
}

export function resolveTokens(theme: ThemeId, mode: SiteMode): ThemeTokens {
  const def = THEMES[theme]
  return mode === 'night' && def.night ? def.night : def.tokens
}

/** CSS custom properties consumed by the shared blocks. */
export function siteCssVars(theme: ThemeId, mode: SiteMode): CSSProperties {
  const t = resolveTokens(theme, mode)
  return {
    '--site-bg': t.bg,
    '--site-fg': t.fg,
    '--site-muted': t.muted,
    '--site-accent': t.accent,
    '--site-line': t.line,
    '--site-font-display': t.fontDisplay,
    '--site-font-body': t.fontBody,
    '--site-font-label': t.fontLabel,
    '--site-radius': t.radius,
    '--site-display-transform': t.displayTransform,
    '--site-display-weight': String(t.displayWeight),
    '--site-display-tracking': t.displayTracking,
  } as CSSProperties
}

/** Catalog entries shown in the editor: 8 items, «Опівніч» = tysha+night. */
export const THEME_CATALOG: { value: string; theme: ThemeId; mode: SiteMode }[] = [
  { value: 'tysha', theme: 'tysha', mode: 'light' },
  { value: 'opivnich', theme: 'tysha', mode: 'night' },
  { value: 'povitria', theme: 'povitria', mode: 'light' },
  { value: 'plivka', theme: 'plivka', mode: 'light' },
  { value: 'zhurnal', theme: 'zhurnal', mode: 'light' },
  { value: 'galereia', theme: 'galereia', mode: 'light' },
  { value: 'arkhiv', theme: 'arkhiv', mode: 'light' },
  { value: 'prodakshn', theme: 'prodakshn', mode: 'light' },
]
