'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import LeadsKpiBar from '@/components/superadmin/leads/LeadsKpiBar'
import LeadsFilters from '@/components/superadmin/leads/LeadsFilters'
import LeadsTable from '@/components/superadmin/leads/LeadsTable'
import type { LeadFilters } from '@/types/lead'

export default function SuperAdminLeadsPage() {
  const [filters, setFilters] = useState<LeadFilters>({})
  const { data, isLoading, isError } = useLeads(filters)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const page  = data?.page ?? 1
  const totalPages = data?.totalPages ?? 1

  return (
    <>
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-3.5">
        <div>
          <h1 className="font-syne font-extrabold text-[24px]">Leads</h1>
          <p className="text-[13px] text-muted mt-0.5">
            {total} prospect{total > 1 ? 's' : ''} capturé{total > 1 ? 's' : ''} via la landing publique
          </p>
        </div>
      </div>

      <LeadsKpiBar />
      <LeadsFilters filters={filters} onChange={setFilters} />
      <LeadsTable items={items} isLoading={isLoading} isError={isError} />

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-[12px] text-muted">
          <div>Page {page} / {totalPages} · {items.length} affichés</div>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setFilters({ ...filters, page: page - 1 })}
              className="px-2.5 py-1 bg-surface border border-border rounded-md text-muted hover:text-text hover:border-accent text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Préc.
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setFilters({ ...filters, page: page + 1 })}
              className="px-2.5 py-1 bg-surface border border-border rounded-md text-muted hover:text-text hover:border-accent text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
