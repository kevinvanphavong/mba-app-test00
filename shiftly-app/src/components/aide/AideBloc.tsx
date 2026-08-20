import type { CSSProperties } from 'react'
import { renderRich } from './renderRich'
import AideFigure from './AideFigure'
import type { AideBloc as Bloc, CalloutTon } from '@/types/aide'

// Fonds teintés construits depuis les triplets RAW → conformes à tous les thèmes.
const CALLOUT_STYLE: Record<CalloutTon, CSSProperties> = {
  tip:  { background: 'rgba(var(--raw-yellow), .07)', borderColor: 'rgba(var(--raw-yellow), .25)' },
  warn: { background: 'rgba(var(--raw-red), .07)',    borderColor: 'rgba(var(--raw-red), .25)' },
  info: { background: 'rgba(var(--raw-blue), .07)',   borderColor: 'rgba(var(--raw-blue), .25)' },
}
const CALLOUT_ICON: Record<CalloutTon, string> = { tip: '💡', warn: '⚠️', info: 'ℹ️' }

/** Rend un bloc de contenu selon son type discriminé. */
export default function AideBloc({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case 'soustitre':
      return (
        <h3 className="mb-1.5 mt-[18px] text-[11.5px] font-bold uppercase tracking-wider text-accent">
          {bloc.texte}
        </h3>
      )

    case 'p':
      return <p className="mb-2 text-[14px] leading-relaxed text-text-soft">{renderRich(bloc.texte)}</p>

    case 'liste':
      return (
        <ul className="my-2 list-disc pl-5 text-[14px] text-text-soft marker:text-muted">
          {bloc.items.map((it, i) => (
            <li key={i} className="mb-1.5 leading-relaxed">{renderRich(it)}</li>
          ))}
        </ul>
      )

    case 'etapes':
      return (
        <ol className="my-2 space-y-2">
          {bloc.items.map((it, i) => (
            <li key={i} className="relative pl-[30px] text-[14px] leading-relaxed text-text-soft">
              <span
                className="absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-pill text-[11px] font-bold text-accent"
                style={{ background: 'rgba(var(--raw-orange), .13)' }}
              >
                {i + 1}
              </span>
              {renderRich(it)}
            </li>
          ))}
        </ol>
      )

    case 'callout':
      return (
        <div
          className="my-2 flex gap-3 rounded-card border p-3 text-[13px] leading-relaxed text-text-soft"
          style={CALLOUT_STYLE[bloc.ton]}
        >
          <span className="flex-shrink-0 text-[15px] leading-tight" aria-hidden>
            {bloc.icone ?? CALLOUT_ICON[bloc.ton]}
          </span>
          <p>{renderRich(bloc.texte)}</p>
        </div>
      )

    case 'tableau':
      return (
        <div className="my-2.5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {bloc.entetes.map((h, i) => (
                  <th key={i} className="border-b border-border px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloc.lignes.map((ligne, r) => (
                <tr key={r}>
                  {ligne.map((cell, c) => (
                    <td key={c} className="border-b border-border px-2.5 py-2 align-top text-text-soft">
                      {renderRich(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'parcours':
      return (
        <div className="my-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          {bloc.etapes.map((e, i) => (
            <div key={i} className="rounded-card border border-border bg-surface2 p-3">
              <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-accent">{e.n}</div>
              <div className="mb-1 text-[13px] font-semibold text-text">{e.titre}</div>
              <div className="text-[12px] leading-snug text-muted">{e.detail}</div>
            </div>
          ))}
        </div>
      )

    case 'figure':
      return <AideFigure src={bloc.src} url={bloc.url} alt={bloc.alt} legende={bloc.legende} pins={bloc.pins} />
  }
}
