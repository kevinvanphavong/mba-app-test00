'use client'

import { useEffect } from 'react'
import { THEMES, useThemeStore, type Theme } from '@/store/themeStore'

// Mirroirise le thème du store Zustand vers <html data-theme="…">.
// Le script anti-FOUC dans layout.tsx pose déjà l'attribut au tout premier paint ;
// ce hook ne fait que suivre les changements ultérieurs (sélection user).
export default function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const next: Theme = (THEMES as ReadonlyArray<string>).includes(theme) ? theme : 'dark'
    document.documentElement.setAttribute('data-theme', next)
  }, [theme])

  return null
}
