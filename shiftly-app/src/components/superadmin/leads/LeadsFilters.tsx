'use client'

import type { LeadFilters, LeadIntent, LeadPlan, LeadStatus } from '@/types/lead'
import { INTENT_META, PLAN_META, STATUS_META, STATUS_ORDER } from './leadMeta'

interface Props {
  filters: LeadFilters
  onChange: (next: LeadFilters) => void
}

const INTENTS: LeadIntent[] = ['trial', 'demo', 'custom']
const PLANS:   LeadPlan[]   = ['starter', 'pro', 'premium', 'undecided']

export default function LeadsFilters({ filters, onChange }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3.5 px-4 mb-3.5 flex gap-3 items-center flex-wrap">
      <div className="flex-1 min-w-[240px] relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={filters.q ?? ''}
          onChange={(e) => onChange({ ...filters, q: e.target.value, page: 1 })}
          placeholder="Rechercher par nom, email ou centre..."
          className="w-full bg-surface2 border border-border text-text py-2 pl-9 pr-3.5 rounded-lg text-[13px] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <ChipGroup
        label="Statut"
        options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))}
        active={filters.status ?? ''}
        onSelect={(v) => onChange({ ...filters, status: (v as LeadStatus) || '', page: 1 })}
      />
      <ChipGroup
        label="Intent"
        options={INTENTS.map((s) => ({ value: s, label: INTENT_META[s].label }))}
        active={filters.intent ?? ''}
        onSelect={(v) => onChange({ ...filters, intent: (v as LeadIntent) || '', page: 1 })}
      />
      <ChipGroup
        label="Plan"
        options={PLANS.map((s) => ({ value: s, label: PLAN_META[s].label }))}
        active={filters.plan ?? ''}
        onSelect={(v) => onChange({ ...filters, plan: (v as LeadPlan) || '', page: 1 })}
      />

      {(filters.status || filters.intent || filters.plan || filters.q) && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-[12px] text-muted hover:text-accent transition px-2 py-1"
        >
          Réinitialiser
        </button>
      )}
    </div>
  )
}

interface ChipGroupProps {
  label:    string
  options:  { value: string; label: string }[]
  active:   string
  onSelect: (value: string) => void
}

function ChipGroup({ label, options, active, onSelect }: ChipGroupProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.8px] font-bold text-muted mr-1">{label}</span>
      {options.map((o) => {
        const on = active === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(on ? '' : o.value)}
            className={[
              'px-2.5 py-1 rounded-[14px] text-[11px] font-semibold border transition',
              on
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-surface2 text-muted border-border hover:text-text hover:border-accent/40',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
