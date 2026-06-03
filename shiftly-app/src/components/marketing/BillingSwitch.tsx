'use client'

import { useLayoutEffect, useRef, useState } from 'react'

export type BillingPeriod = 'monthly' | 'yearly'

// Switcher animé Mensuel / Annuel — calcule la position du thumb au layout
// pour qu'il colle au bouton actif quelle que soit la largeur du texte.
export default function BillingSwitch({
  period,
  onChange,
}: {
  period: BillingPeriod
  onChange: (p: BillingPeriod) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const monthlyRef = useRef<HTMLButtonElement>(null)
  const yearlyRef = useRef<HTMLButtonElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number }>({ left: 5, width: 0 })

  useLayoutEffect(() => {
    const container = containerRef.current
    const active = (period === 'monthly' ? monthlyRef : yearlyRef).current
    if (!container || !active) return
    const setPos = () => {
      const cRect = container.getBoundingClientRect()
      const aRect = active.getBoundingClientRect()
      setThumb({ left: aRect.left - cRect.left, width: aRect.width })
    }
    setPos()
    window.addEventListener('resize', setPos)
    return () => window.removeEventListener('resize', setPos)
  }, [period])

  return (
    <div className="mkt-billing-switch-wrap">
      <div className="mkt-billing-switch" ref={containerRef}>
        <span
          className="mkt-billing-thumb"
          style={{ left: `${thumb.left}px`, width: `${thumb.width}px` }}
        />
        <button
          type="button"
          ref={monthlyRef}
          className={period === 'monthly' ? 'is-active' : ''}
          onClick={() => onChange('monthly')}
        >
          Mensuel
        </button>
        <button
          type="button"
          ref={yearlyRef}
          className={period === 'yearly' ? 'is-active' : ''}
          onClick={() => onChange('yearly')}
        >
          Annuel
          <span className="mkt-billing-save">−2 mois 🎁</span>
        </button>
      </div>
    </div>
  )
}
