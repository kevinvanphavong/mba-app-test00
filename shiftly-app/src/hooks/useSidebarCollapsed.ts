'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'shiftly:sidebar-collapsed'

// Lit l'état persisté de manière safe (SSR, Safari privé, localStorage bloqué).
function readStored(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Écrit sans propager l'erreur si l'accès est refusé.
function writeStored(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // pas d'écho : on accepte la perte silencieuse en mode privé
  }
}

// Évite de capturer le raccourci si l'utilisateur tape dans un champ.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

/**
 * Hook qui gère le mode collapsed de la Sidebar desktop.
 * - Initial render serveur : `false` (évite tout mismatch d'hydration)
 * - Au mount client : lit le dernier état stocké et le restaure
 * - Cmd/Ctrl + B : toggle global, ignoré si focus est dans un champ éditable
 *
 * La persistance utilise localStorage avec fallback silencieux.
 */
export function useSidebarCollapsed(): {
  collapsed: boolean
  toggle:    () => void
  set:       (value: boolean) => void
} {
  const [collapsed, setCollapsed] = useState(false)

  // Hydration : on lit le storage côté client uniquement, après le premier render.
  useEffect(() => {
    setCollapsed(readStored())
  }, [])

  const set = useCallback((value: boolean) => {
    setCollapsed(value)
    writeStored(value)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      writeStored(next)
      return next
    })
  }, [])

  // Raccourci global Cmd/Ctrl + B (ignore les champs éditables).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key !== 'b' && e.key !== 'B') return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  return { collapsed, toggle, set }
}
