'use client'

import { useRouter }        from 'next/navigation'
import { useMissions }      from '@/hooks/useMissions'
import { useCompetences }   from '@/hooks/useCompetences'
import MissionRow           from './MissionRow'
import CompetenceRow        from './CompetenceRow'
import type { Zone }        from '@/types/index'

// ─── Composant principal — fiche de poste d'une zone ──────────────────────────

interface Props {
  zone: Zone
}

export default function PosteCard({ zone }: Props) {
  const router = useRouter()

  const { data: missions,    isLoading: loadMissions,    isError: errMissions    } = useMissions(zone.id)
  const { data: competences, isLoading: loadCompetences, isError: errCompetences } = useCompetences(zone.id)

  // ─── Section générique avec états loading / error / empty ─────────────────

  function Section({
    label, loading, error, empty, children,
  }: {
    label: string
    loading: boolean
    error: boolean
    empty: boolean
    children: React.ReactNode
  }) {
    return (
      <div>
        <div className="text-[10px] font-syne font-bold uppercase tracking-widest text-muted mb-2">
          {label}
        </div>
        {loading && (
          <div className="flex gap-1.5 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-3 rounded bg-surface2 animate-pulse flex-1" />
            ))}
          </div>
        )}
        {!loading && error && (
          <p className="text-[11px] text-red py-2">Erreur de chargement.</p>
        )}
        {!loading && !error && empty && (
          <p className="text-[11px] text-muted py-2">Aucun élément.</p>
        )}
        {!loading && !error && !empty && children}
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-[18px] overflow-hidden">

      {/* ── En-tête zone ── */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{
          background:   `${zone.couleur}14`,
          borderBottom: `1px solid ${zone.couleur}22`,
        }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: zone.couleur ?? 'var(--muted)' }} />
        <span className="font-syne font-extrabold text-[15px]" style={{ color: zone.couleur ?? 'var(--text)' }}>
          {zone.nom}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* ── Compétences requises ── */}
        <Section
          label="Compétences requises"
          loading={loadCompetences}
          error={errCompetences}
          empty={!competences || competences.length === 0}
        >
          <div className="flex flex-col gap-2">
            {competences?.map(c => <CompetenceRow key={c.id} competence={c} />)}
          </div>
        </Section>

        {/* ── Missions ── */}
        <Section
          label="Missions"
          loading={loadMissions}
          error={errMissions}
          empty={!missions || missions.length === 0}
        >
          <div className="flex flex-col">
            {missions?.map(m => <MissionRow key={m.id} mission={m} />)}
          </div>
        </Section>

        {/* ── Lien tutoriels ── */}
        <button
          onClick={() => router.push(`/tutoriels?zone=${encodeURIComponent(zone.nom)}`)}
          className="w-full py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted
                     hover:text-text hover:border-text transition-colors text-center"
        >
          Voir les tutoriels de cette zone →
        </button>

      </div>
    </div>
  )
}
