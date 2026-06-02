'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import type { HaccpRegistreItem } from '@/types/haccp'

interface Props { item: HaccpRegistreItem }

const TYPE_LABEL: Record<string, string> = {
  TEMPERATURE: 'T°',
  DLC:         'DLC',
  PHOTO:       'Photo',
  RECEPTION:   'Réception',
}

export default function HaccpRegistreRow({ item }: Props) {
  const heure = item.createdAt ? format(new Date(item.createdAt), 'HH:mm', { locale: fr }) : '—'

  const valeurAffichee = (() => {
    if (item.valeurNumerique != null) {
      const unite = item.spec?.seuils.unite ?? '°C'
      return `${item.valeurNumerique}${unite}`
    }
    if (item.dateReleve) return `DLC ${format(new Date(item.dateReleve), 'd MMM yyyy', { locale: fr })}`
    return '—'
  })()

  const badgeText  = item.estConforme === null ? '—' : item.estConforme ? 'Conforme' : 'Non conforme'
  const badgeClass = item.estConforme === null ? 'bg-surface2 text-muted'
    : item.estConforme ? 'bg-green/10 text-green' : 'bg-red/10 text-red'

  return (
    <li className="grid grid-cols-[44px_1fr_auto] tablet:grid-cols-[60px_64px_1fr_auto_auto_auto] gap-3 items-center px-3 py-2 border-b border-border last:border-b-0">
      <span className="font-syne font-bold text-[12px] text-muted">{heure}</span>
      <span className="hidden tablet:inline text-[11px] font-bold uppercase tracking-wider text-muted">
        {item.spec ? TYPE_LABEL[item.spec.typeReleve] : '—'}
      </span>
      <div className="min-w-0">
        <div className={`${ty.cardTitle} truncate`}>{item.mission?.texte ?? '—'}</div>
        <div className={`${ty.metaSm} truncate`}>
          {item.equipement?.nom ?? '—'}
          {item.relevePar && ` · ${item.relevePar.prenom ?? ''} ${item.relevePar.nom}`}
          {item.note && ` · ${item.note}`}
        </div>
      </div>
      <span className="font-syne font-bold text-[13px]">{valeurAffichee}</span>
      {item.hasPhoto && item.photoUrl ? (
        <a href={item.photoUrl} target="_blank" rel="noreferrer" className="text-[18px]" title="Voir la photo">📷</a>
      ) : <span className="text-[18px] text-muted/40">·</span>}
      <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-[6px] whitespace-nowrap', badgeClass)}>
        {badgeText}
      </span>
    </li>
  )
}
