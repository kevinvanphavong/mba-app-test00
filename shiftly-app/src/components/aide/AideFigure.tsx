'use client'

import { useState } from 'react'
import { renderRich } from './renderRich'
import type { AideFigurePin } from '@/types/aide'

type Props = {
  src:     string
  url:     string
  alt:     string
  legende: string
  pins:    AideFigurePin[]
}

/**
 * Capture annotée façon « fenêtre de navigateur » : barre + URL, image, pastilles
 * numérotées positionnées en % (--x/--y de la maquette), puis légende.
 * En cas d'image manquante, un état de repli remplace le cadre.
 */
export default function AideFigure({ src, url, alt, legende, pins }: Props) {
  const [broken, setBroken] = useState(false)

  return (
    <figure className="my-3.5">
      <div className="relative overflow-hidden rounded-card-sm border border-border-strong bg-surface2 shadow-card">
        {/* Barre du navigateur */}
        <div className="flex items-center gap-1.5 border-b border-border bg-surface3 px-3 py-2">
          {[0, 1, 2].map(i => (
            <span key={i} className="block h-[9px] w-[9px] rounded-pill bg-border-strong" />
          ))}
          <em className="ml-2 font-mono text-[11px] not-italic text-muted">{url}</em>
        </div>

        {broken ? (
          <div className="flex min-h-[190px] flex-col items-center justify-center gap-1.5 text-muted">
            <span className="text-[26px] opacity-40" aria-hidden>🖼</span>
            <span className="text-[12px]">{alt}</span>
          </div>
        ) : (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="block h-auto w-full" onError={() => setBroken(true)} />
            {pins.map(pin => (
              <span
                key={pin.n}
                className="absolute z-[2] flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill border-2 border-bg bg-accent text-[12px] font-extrabold text-accent-on shadow-pop"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                {pin.n}
                <span
                  className="pointer-events-none absolute -inset-1.5 rounded-pill border-2"
                  style={{ borderColor: 'rgba(var(--raw-orange), .35)' }}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      <figcaption className="mt-2 text-[12.5px] leading-relaxed text-muted">
        {renderRich(legende)}
      </figcaption>
    </figure>
  )
}
