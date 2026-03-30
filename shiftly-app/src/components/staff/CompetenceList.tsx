import { cn } from '@/lib/cn'
import type { StaffCompetenceItem } from '@/types/staff'

const DIFF_LABEL: Record<string, string> = {
  simple:      'Simple',
  avancee:     'Avancé',
  experimente: 'Expert',
}
const DIFF_CLS: Record<string, string> = {
  simple:      'text-green  bg-green/10   border-green/20',
  avancee:     'text-yellow bg-yellow/10  border-yellow/20',
  experimente: 'text-red    bg-red/10     border-red/20',
}

interface CompetenceListProps {
  competences: StaffCompetenceItem[]
}

/** Liste des compétences acquises groupées par zone */
export default function CompetenceList({ competences }: CompetenceListProps) {
  if (competences.length === 0) {
    return <p className="text-[12px] text-muted py-1">Aucune compétence enregistrée.</p>
  }

  // Grouper par zone
  const grouped = competences.reduce<Record<string, StaffCompetenceItem[]>>((acc, c) => {
    const key = c.zoneName ?? 'Général'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-2.5">
      {Object.entries(grouped).map(([zone, comps]) => {
        const color = comps[0]?.zoneCouleur ?? '#6b7280'
        return (
          <div key={zone}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color }}>
                {zone}
              </span>
            </div>

            <div className="flex flex-col gap-1 pl-3">
              {comps.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 py-1.5 px-2.5 bg-surface2 rounded-[8px]"
                >
                  <span className="text-[12px] text-text flex-1 truncate">{c.nom}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={cn(
                        'text-[9px] font-extrabold px-1.5 py-0.5 rounded-[4px] border',
                        DIFF_CLS[c.difficulte] ?? 'text-muted bg-surface2 border-border'
                      )}
                    >
                      {DIFF_LABEL[c.difficulte]}
                    </span>
                    <span className="text-[10px] font-bold text-accent font-syne">+{c.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
