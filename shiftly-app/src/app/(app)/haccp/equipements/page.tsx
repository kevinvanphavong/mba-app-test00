'use client'

import { useState } from 'react'
import Topbar           from '@/components/layout/Topbar'
import PageContainer    from '@/components/layout/PageContainer'
import HaccpTabsNav         from '@/components/haccp/HaccpTabsNav'
import HaccpSyncBanner      from '@/components/haccp/HaccpSyncBanner'
import HaccpEquipementList  from '@/components/haccp/HaccpEquipementList'
import HaccpEquipementForm  from '@/components/haccp/HaccpEquipementForm'
import { ty } from '@/lib/typography'
import {
  useHaccpEquipements,
  useCreerEquipement,
  useModifierEquipement,
  useToggleEquipementActif,
  useSupprimerEquipement,
  useRegenererMissions,
} from '@/hooks/useHaccp'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { HaccpEquipement, HaccpEquipementInput, HaccpSyncResult } from '@/types/haccp'

export default function HaccpEquipementsPage() {
  const router = useRouter()
  const { user, loading } = useCurrentUser()

  useEffect(() => {
    if (!loading && user && user.role !== 'MANAGER') router.replace('/haccp')
  }, [user, loading, router])

  const { data: equipements = [], isLoading, isError } = useHaccpEquipements()
  const creer       = useCreerEquipement()
  const modifier    = useModifierEquipement()
  const toggleActif = useToggleEquipementActif()
  const supprimer   = useSupprimerEquipement()
  const regenerer   = useRegenererMissions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState<HaccpEquipement | null>(null)
  const [syncResult, setSyncResult] = useState<HaccpSyncResult | null>(null)

  if (loading || !user || user.role !== 'MANAGER') return null

  const handleCreate = () => { setEditing(null); setFormOpen(true) }
  const handleEdit   = (e: HaccpEquipement) => { setEditing(e); setFormOpen(true) }

  const handleSubmit = async (payload: HaccpEquipementInput) => {
    if (editing) await modifier.mutateAsync({ id: editing.id, ...payload })
    else         await creer.mutateAsync(payload)
    setFormOpen(false)
  }

  const handleDelete = async (e: HaccpEquipement) => {
    if (!window.confirm(`Supprimer "${e.nom}" ? Les missions T° associées seront aussi supprimées.`)) return
    await supprimer.mutateAsync(e.id)
  }

  const handleSync = async () => {
    const r = await regenerer.mutateAsync()
    setSyncResult(r)
  }

  const busy = creer.isPending || modifier.isPending || supprimer.isPending || toggleActif.isPending

  return (
    <div className="min-h-full animate-fadeUp">
      <Topbar title="HACCP" subtitle="Équipements & seuils" />
      <PageContainer className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <HaccpTabsNav />
          <button
            onClick={handleCreate}
            className="py-2 px-4 rounded-[10px] bg-accent text-white text-[13px] font-semibold"
          >+ Nouvel équipement</button>
        </div>

        <HaccpSyncBanner onSync={handleSync} loading={regenerer.isPending} result={syncResult} />

        {isLoading && (
          <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-3 animate-pulse">
            {[0,1,2].map(i => <div key={i} className="h-[140px] bg-surface border border-border rounded-[14px]" />)}
          </div>
        )}

        {isError && <p className="text-red text-[13px]">Impossible de charger les équipements.</p>}

        {!isLoading && !isError && (
          <HaccpEquipementList
            equipements={equipements}
            onEdit={handleEdit}
            onToggleActif={(e) => toggleActif.mutate({ id: e.id, actif: !e.actif })}
            onDelete={handleDelete}
            busy={busy}
          />
        )}

        <p className={`${ty.metaSm} text-center pt-2`}>
          Les missions HACCP T° sont gérées automatiquement par le système.
        </p>
      </PageContainer>

      <HaccpEquipementForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={creer.isPending || modifier.isPending}
      />
    </div>
  )
}
