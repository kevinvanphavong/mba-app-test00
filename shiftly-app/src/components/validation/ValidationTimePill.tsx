'use client'

/**
 * ValidationTimePill — Pilule horaire cliquable du panneau détail employé.
 * Variantes : ok | late | auto | modified | empty | neutral
 * Affiche un diff inline (old → new) en variant 'modified'.
 */

import { forwardRef } from 'react'

export type TimePillVariant = 'ok' | 'late' | 'auto' | 'modified' | 'empty' | 'neutral'

interface Props {
  variant: TimePillVariant
  /** Heure courante 'HH:MM' (ou un libellé custom comme '12:00 – 12:20'). */
  time: string
  /** Ancienne valeur (variant 'modified' uniquement) — 'HH:MM'. */
  oldTime?: string
  /** Libellé court devant l'heure ('Arr.' / 'Dép.'…). */
  label?: string
  /** Icône à droite. */
  icon?: string
  /** Info textuelle après l'heure (ex: '(20 min)' pour une pause). */
  subInfo?: string
  /** Texte d'aria-label pour l'accessibilité (lecteurs d'écran + e2e). */
  ariaLabel?: string
  /** Titre HTML (tooltip natif). */
  title?: string
  /** Si défini, rend la pilule cliquable. */
  onClick?: () => void
}

const ValidationTimePill = forwardRef<HTMLButtonElement | HTMLSpanElement, Props>(
  function ValidationTimePill(
    { variant, time, oldTime, label, icon, subInfo, ariaLabel, title, onClick }: Props,
    ref,
  ) {
    const className = `validation-time-pill validation-time-pill--${variant}${onClick ? ' validation-time-pill--clickable' : ''}`

    const content = (
      <>
        {label && <span className="validation-time-pill__lbl">{label}</span>}
        {variant === 'modified' && oldTime ? (
          <>
            <span className="validation-time-pill__old">{oldTime}</span>
            <span className="validation-time-pill__arrow">→</span>
            <span className="validation-time-pill__new">{time}</span>
          </>
        ) : (
          <span className="validation-time-pill__val">{time}</span>
        )}
        {variant === 'auto' && <span className="validation-time-pill__auto-tag">auto</span>}
        {subInfo && <span className="validation-time-pill__sub">{subInfo}</span>}
        {icon && <span className="validation-time-pill__icon">{icon}</span>}
      </>
    )

    if (onClick) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={className}
          onClick={onClick}
          aria-label={ariaLabel}
          title={title}
        >
          {content}
        </button>
      )
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={className}
        aria-label={ariaLabel}
        title={title}
      >
        {content}
      </span>
    )
  }
)

export default ValidationTimePill
