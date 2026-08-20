import AideBloc from './AideBloc'
import type { AideRubrique } from '@/types/aide'

/** Une rubrique de l'aide : titre + badge de rôle, puis ses blocs. */
export default function AideSection({ rubrique }: { rubrique: AideRubrique }) {
  const badge = rubrique.managerOnly
    ? { label: 'Gérant', style: { background: 'rgba(var(--raw-orange), .15)', color: 'var(--accent)' } }
    : { label: 'Tout le monde', style: { background: 'rgba(var(--raw-green), .15)', color: 'var(--green)' } }

  return (
    <section
      id={rubrique.id}
      data-rubrique-id={rubrique.id}
      className="scroll-mt-5 border-b border-border py-6 last:border-b-0"
    >
      <h2 className="mb-1 flex flex-wrap items-center gap-2.5 font-syne text-[20px] font-extrabold uppercase tracking-wide text-text">
        {rubrique.titre}
        <span
          className="rounded-pill px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide"
          style={badge.style}
        >
          {badge.label}
        </span>
      </h2>

      {rubrique.blocs.map((bloc, i) => (
        <AideBloc key={i} bloc={bloc} />
      ))}
    </section>
  )
}
