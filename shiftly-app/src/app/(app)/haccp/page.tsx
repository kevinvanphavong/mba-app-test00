'use client'

import { useState } from 'react'
import Topbar           from '@/components/layout/Topbar'
import PageContainer    from '@/components/layout/PageContainer'
import HaccpTabsNav     from '@/components/haccp/HaccpTabsNav'
import HaccpKpis        from '@/components/haccp/HaccpKpis'
import HaccpRegistreFilters from '@/components/haccp/HaccpRegistreFilters'
import HaccpRegistreTable   from '@/components/haccp/HaccpRegistreTable'
import { useHaccpRegistre } from '@/hooks/useHaccp'
import { useMemo } from 'react'
import type { HaccpReleveType } from '@/types/haccp'

export default function HaccpPage() {
  const moisDefault = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const [mois, setMois] = useState(moisDefault)
  const [type, setType] = useState<HaccpReleveType | ''>('')
  const [conforme, setConforme] = useState<'all' | 'ok' | 'ko'>('all')

  const conformeBool = conforme === 'ok' ? true : conforme === 'ko' ? false : undefined

  const { data, isLoading, isError } = useHaccpRegistre({
    mois,
    type: type || undefined,
    conforme: conformeBool,
  })

  return (
    <div className="min-h-full animate-fadeUp">
      <Topbar title="HACCP" subtitle="Registre des relevés" />
      <PageContainer className="space-y-4">
        <HaccpTabsNav />

        <HaccpRegistreFilters
          mois={mois} type={type} conforme={conforme}
          onMois={setMois} onType={setType} onConforme={setConforme}
        />

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 desktop:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-[12px] bg-surface border border-border" />
              ))}
            </div>
            <div className="h-[120px] rounded-[14px] bg-surface border border-border" />
          </div>
        )}

        {isError && (
          <p className="text-red text-[13px]">Impossible de charger le registre.</p>
        )}

        {data && (
          <>
            <HaccpKpis data={data.kpis} />
            <HaccpRegistreTable items={data.items} />
          </>
        )}
      </PageContainer>
    </div>
  )
}
