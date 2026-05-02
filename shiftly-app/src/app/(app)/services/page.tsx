'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useServicesList, useDeleteService, useAddServiceNote } from '@/hooks/useService'
import { ty } from '@/lib/typography'
import Topbar from '@/components/layout/Topbar'
import ModalCreateService from '@/components/services/ModalCreateService'
import ServicesMobileView from '@/components/services/ServicesMobileView'
import ServicesDesktopView from '@/components/services/ServicesDesktopView'

/**
 * Page /services — orchestrateur :
 * - Topbar global commun aux deux viewports
 * - Vue mobile (< lg) : sections « Aujourd'hui / À venir / Passés » + cards
 * - Vue desktop (≥ lg) : hero + onglets + filtre période + tableau dépliant
 *
 * Modales partagées (création service, suppression, note) gérées ici.
 * La modale d'assignation poste est portée côté desktop (contexte zone).
 */
export default function ServicesPage() {
  const isManager = useAuthStore(s => s.user?.role === 'MANAGER')
  const centreId  = useAuthStore(s => s.centreId)
  const { user }  = useCurrentUser()

  const { data, isLoading, isError, refetch } = useServicesList()
  const { mutate: deleteService } = useDeleteService()
  const { mutate: addNote }       = useAddServiceNote()

  const [showCreate, setShowCreate] = useState(false)

  const services    = data ?? []
  const centreName  = user?.centre?.nom ?? ''
  const subtitle    = `${centreName} · ${services.length} service${services.length > 1 ? 's' : ''}`

  function handleDelete(id: number) {
    if (window.confirm('Supprimer ce service ? Cette action est irréversible.')) {
      deleteService(id)
    }
  }

  function handleAddNote(id: number, note: string) {
    addNote({ serviceId: id, note })
  }

  // Loading / error : mêmes skeletons sur les deux viewports — la vue desktop
  // fournit son propre rendu plus dense, la vue mobile celui d'origine.
  return (
    <>
      <Topbar title="Services" subtitle={isLoading || isError ? centreName : subtitle} />

      {/* ── Mobile ───────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {!centreId || isLoading ? (
          <MobileSkeleton />
        ) : isError ? (
          <MobileError onRetry={refetch} />
        ) : (
          <ServicesMobileView
            services={services}
            isManager={!!isManager}
            onDelete={handleDelete}
            onAddNote={handleAddNote}
            onOpenCreate={() => setShowCreate(true)}
          />
        )}
      </div>

      {/* ── Desktop ──────────────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <ServicesDesktopView
          services={services}
          centreName={centreName}
          isManager={!!isManager}
          isLoading={!centreId || isLoading}
          isError={isError}
          onSaveNote={handleAddNote}
          onOpenCreate={() => setShowCreate(true)}
          onRetry={refetch}
        />
      </div>

      {/* Modale création service (partagée mobile + desktop) */}
      {isManager && (
        <ModalCreateService
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  )
}

// ─── Skeletons mobile (extraits pour ne pas dupliquer dans ServicesMobileView)

function MobileSkeleton() {
  return (
    <div className="mx-auto px-5 py-6 lg:max-w-2xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="h-5 w-28 bg-surface2 rounded-lg animate-pulse" />
          <div className="h-3 w-40 bg-surface2 rounded mt-2 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-surface border border-border rounded-[18px] animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function MobileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto px-5 py-6 lg:max-w-2xl">
      <div className="bg-surface border border-red/20 rounded-[18px] p-8 text-center">
        <p className="text-[28px] mb-2">⚠️</p>
        <p className={`${ty.cardTitleMd} text-red font-bold`}>Erreur de chargement</p>
        <p className={`${ty.metaLg} mt-1 mb-4`}>Impossible de récupérer le planning.</p>
        <button
          onClick={onRetry}
          className={`${ty.body} px-4 py-2 bg-surface2 border border-border rounded-[10px] hover:border-accent transition-colors`}
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
