import { getGradientFromColor } from '@/lib/colors'
import { getInitials, getDisplayName } from '@/lib/userDisplay'
import type { ServiceListStaffMember } from '@/types/index'

interface TeamBubblesProps {
  /** Liste des membres à représenter */
  members: ServiceListStaffMember[]
  /** Effectif total à afficher (peut être > members.length si la liste reçue est tronquée) */
  total?:  number
  /** Nb max de bubbles avant overflow "+N" — défaut 4 */
  max?:    number
}

/**
 * Avatars empilés (initiales + gradient) — vue dense pour la colonne "Équipe"
 * du tableau /services. 4 bubbles max + bulle "+N" si plus.
 *
 * Réutilise `getGradientFromColor` pour rester cohérent avec MemberCard / Sidebar.
 */
export default function TeamBubbles({ members, total, max = 4 }: TeamBubblesProps) {
  const shown      = members.slice(0, max)
  const fullCount  = total ?? members.length
  const extra      = Math.max(0, fullCount - shown.length)

  if (shown.length === 0) {
    return <span className="text-[11px] text-muted italic">—</span>
  }

  return (
    <div className="flex items-center">
      {shown.map((m, idx) => (
        <div
          key={m.id}
          title={getDisplayName(m.nom, m.prenom)}
          className="w-7 h-7 rounded-[7px] flex items-center justify-center font-syne font-semibold text-[9px] text-white border-2 border-surface relative"
          style={{
            background:  getGradientFromColor(m.avatarColor),
            marginLeft:  idx === 0 ? 0 : -6,
            zIndex:      10 - idx,
          }}
        >
          {getInitials(m.nom, m.prenom)}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center font-syne font-semibold text-[8px] text-muted bg-surface2 border-2 border-surface"
          style={{ marginLeft: -6 }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
