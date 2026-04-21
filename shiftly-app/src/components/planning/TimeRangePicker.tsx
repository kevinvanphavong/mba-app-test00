'use client'

import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { ShiftFormValues } from './ShiftModal'

interface TimeRangePickerProps {
  register: UseFormRegister<ShiftFormValues>
  errors:   FieldErrors<ShiftFormValues>
}

const inputCls = `
  w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface2)]
  px-3 py-[10px] text-[13px] text-[var(--text)]
  focus:border-[var(--accent)] outline-none transition-colors
`

/** Sélecteurs heure début, heure fin et pause (utilisés dans ShiftModal) */
export default function TimeRangePicker({ register, errors }: TimeRangePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--muted)]">
          Début
        </label>
        <input type="time" className={inputCls} {...register('heureDebut')} />
        {errors.heureDebut && (
          <p className="mt-1 text-[10px] text-[var(--red)]">{errors.heureDebut.message}</p>
        )}
      </div>

      <div>
        <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--muted)]">
          Fin
        </label>
        <input type="time" className={inputCls} {...register('heureFin')} />
        {errors.heureFin && (
          <p className="mt-1 text-[10px] text-[var(--red)]">{errors.heureFin.message}</p>
        )}
      </div>

      <div>
        <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--muted)]">
          Pause (min)
        </label>
        <input
          type="number"
          min={0}
          max={120}
          step={5}
          className={inputCls}
          {...register('pauseMinutes', { valueAsNumber: true })}
        />
      </div>
    </div>
  )
}
