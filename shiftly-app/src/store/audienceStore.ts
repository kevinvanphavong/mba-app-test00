import { create } from 'zustand'

// Audience cible de la landing publique :
// - 'loisirs'  : parcs (bowling, laser, arcade, karaoké, VR) — défaut
// - 'commerce' : commerces de proximité (cafés, restos, salons, garages, boutiques)
//
// Le choix est persisté dans localStorage (clé `shiftly-audience`). Pour éviter
// le mismatch SSR / client, on initialise toujours côté serveur avec 'loisirs'
// et on hydrate au mount via `hydrate()` (cf. HeroSection).
export type Audience = 'loisirs' | 'commerce'

type AudienceState = {
  audience: Audience
  setAudience: (a: Audience) => void
  hydrate: () => void
}

const STORAGE_KEY = 'shiftly-audience'

function readStored(): Audience {
  if (typeof window === 'undefined') return 'loisirs'
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'commerce' ? 'commerce' : 'loisirs'
  } catch {
    // Safari privé / quota / accès bloqué : fallback silencieux
    return 'loisirs'
  }
}

function writeStored(a: Audience): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, a)
  } catch {
    /* fallback silencieux */
  }
}

export const useAudience = create<AudienceState>((set) => ({
  audience: 'loisirs',
  setAudience: (audience) => {
    writeStored(audience)
    set({ audience })
  },
  hydrate: () => set({ audience: readStored() }),
}))
