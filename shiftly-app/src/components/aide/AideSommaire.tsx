'use client'

import { useEffect, useState } from 'react'

type Item = { id: string; titre: string }

/**
 * Sommaire de l'aide : liste verticale sticky en desktop, chips qui s'enroulent en
 * mobile. Le surlignage suit le scroll via IntersectionObserver (scrollspy). Le clic
 * amène la rubrique en haut du conteneur scrollable (respecte scroll-mt des sections).
 */
export default function AideSommaire({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)

  // Réobserve à chaque changement de liste visible (filtre rôle / recherche).
  useEffect(() => {
    const nodes = items
      .map(it => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveId(e.target.id)
        })
      },
      { rootMargin: '-10% 0px -75% 0px' },
    )
    nodes.forEach(n => observer.observe(n))
    return () => observer.disconnect()
  }, [items])

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <nav className="desktop:sticky desktop:top-6 desktop:max-h-[calc(100vh-3rem)] desktop:overflow-y-auto">
      <p className="px-2.5 pb-2 text-[9.5px] font-bold uppercase tracking-widest text-muted">Sommaire</p>
      <div className="flex flex-wrap gap-1 desktop:flex-col desktop:flex-nowrap">
        {items.map(it => {
          const active = activeId === it.id
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => goTo(it.id)}
              aria-current={active ? 'true' : undefined}
              style={active ? { background: 'rgba(var(--raw-orange), .07)' } : undefined}
              className={`rounded-[7px] border px-2.5 py-1.5 text-left text-[11.5px] font-bold uppercase tracking-wide transition-colors desktop:border-y-0 desktop:border-r-0 desktop:border-l-2 ${
                active
                  ? 'border-border text-accent desktop:border-l-accent'
                  : 'border-border text-muted hover:text-text-soft desktop:border-l-transparent'
              }`}
            >
              {it.titre}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
