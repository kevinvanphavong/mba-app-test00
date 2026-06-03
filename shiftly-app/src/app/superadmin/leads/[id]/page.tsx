'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLead } from '@/hooks/useLeads'
import LeadDetailPanel from '@/components/superadmin/leads/LeadDetailPanel'

export default function SuperAdminLeadDetailPage() {
  const params = useParams<{ id: string }>()
  const id     = Number(params?.id)
  const { data: lead, isLoading, isError } = useLead(Number.isFinite(id) ? id : null)

  return (
    <>
      <div className="mb-5">
        <Link href="/superadmin/leads" className="text-[12px] text-muted hover:text-accent transition">
          ← Retour aux leads
        </Link>
      </div>

      {isLoading && <div className="p-10 text-center text-muted text-[13px]">Chargement…</div>}
      {isError   && <div className="p-10 text-center text-red text-[13px]">Lead introuvable.</div>}
      {!isLoading && !isError && lead && <LeadDetailPanel lead={lead} />}
    </>
  )
}
