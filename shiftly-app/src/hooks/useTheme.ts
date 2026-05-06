'use client'

import { useEffect, useState } from 'react'

/**
 * Thèmes disponibles. Source de vérité : src/app/globals.css (3 blocs data-theme).
 */
export type Theme = 'dark' | 'light' | 'sand'

const STORAGE_KEY = 'shiftly-theme'
const DEFAULT_THEME: Theme = 'dark'

/**
 * Garde-fou type-safe : valeur localStorage → Theme valide ou null.
 */
function parseTheme(raw: string | null): Theme | null {
  return raw === 'dark' || raw === 'light' || raw === 'sand' ? raw : null
}

/**
 * Lit le thème actuel depuis l'attribut data-theme du <html>.
 * Cohérent avec le script anti-FOUC injecté dans src/app/layout.tsx.
 */
function readTheme(): Theme {
  if (typeof document === 'undefined') return DEFAULT_THEME
  const attr = document.documentElement.getAttribute('data-theme')
  return parseTheme(attr) ?? DEFAULT_THEME
}

/**
 * Hook de gestion du thème.
 *
 * Source de vérité : attribut `data-theme` sur `<html>`, miroirsé en localStorage.
 *
 * SSR : `theme` reste à DEFAULT_THEME au premier rendu pour éviter le mismatch
 * d'hydratation, puis se synchronise via useEffect côté client.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  // Sync initiale côté client (lit data-theme posé par le script anti-FOUC)
  useEffect(() => {
    setThemeState(readTheme())
  }, [])

  const setTheme = (next: Theme) => {
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage indisponible (mode privé Safari, quotas) : on continue,
      // le choix sera juste perdu au reload.
    }
    setThemeState(next)
  }

  return { theme, setTheme }
}
