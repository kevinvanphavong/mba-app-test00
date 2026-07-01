'use client'

import { useState } from 'react'
import type { SiteContenu } from '@/features/monsite/types'
import { useUpdateSiteContenu } from '@/features/monsite/useMonSite'

/**
 * Édition des textes du site public (hero + description). Texte simple : assaini
 * côté serveur (strip_tags) et échappé à l'affichage (#5). Monté avec une `key`
 * liée au contenu → repart de l'état serveur après sauvegarde.
 */
export default function SiteTextes({ contenu }: { contenu: SiteContenu }) {
  const [titre, setTitre] = useState(contenu.siteHeroTitre ?? '')
  const [sousTitre, setSousTitre] = useState(contenu.siteHeroSousTitre ?? '')
  const [desc, setDesc] = useState(contenu.siteDescription ?? '')
  const update = useUpdateSiteContenu()

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="font-syne text-lg font-bold text-text">Textes du site</h2>

      <Champ label="Titre du hero">
        <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={150} className="w-full rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      </Champ>
      <Champ label="Sous-titre">
        <input value={sousTitre} onChange={(e) => setSousTitre(e.target.value)} maxLength={200} className="w-full rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      </Champ>
      <Champ label="Description">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={2000} rows={3} className="w-full rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      </Champ>

      <button
        onClick={() => update.mutate({ siteHeroTitre: titre, siteHeroSousTitre: sousTitre, siteDescription: desc })}
        disabled={update.isPending}
        className="self-start rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-on disabled:opacity-40"
      >
        {update.isPending ? 'Enregistrement…' : 'Enregistrer les textes'}
      </button>
      {update.isError && <p className="text-sm text-red">Enregistrement impossible, réessaie.</p>}
    </div>
  )
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  )
}
