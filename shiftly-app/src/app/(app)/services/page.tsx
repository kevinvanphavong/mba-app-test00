'use client'

import { useState }             from 'react'
import { motion }               from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import { useAuthStore }         from '@/store/authStore'
import { useServices, useDeleteService, useAddServiceNote } from '@/hooks/useServices'
import ServiceCard              from '@/components/services/ServiceCard'
import ModalCreateService       from '@/components/services/ModalCreateService'

// ─── Page Planning ────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const isManager  = useAuthStore(s => s.user?.role === 'MANAGER')
  const centreId   = useAuthStore(s => s.centreId)

  const { data, isLoading, isError, refetch } = useServices()

  const { mutate: deleteService } = useDeleteService()
  const { mutate: addNote }       = useAddServiceNote()

  const [showCreate, setShowCreate] = useState(false)

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!centreId || isLoading) {
    return (
      <div className="max-w-[390px] mx-auto px-5 py-6 lg:max-w-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="h-5 w-28 bg-surface2 rounded-lg animate-pulse" />
            <div className="h-3 w-40 bg-surface2 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-surface border border-border rounded-[18px] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Erreur ─────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="max-w-[390px] mx-auto px-5 py-6 lg:max-w-2xl">
        <div className="bg-surface border border-red/20 rounded-[18px] p-8 text-center">
          <p className="text-[28px] mb-2">⚠️</p>
          <p className="text-red font-semibold text-[14px]">Erreur de chargement</p>
          <p className="text-muted text-[12px] mt-1 mb-4">
            Impossible de récupérer le planning.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-surface2 border border-border rounded-[10px] text-[12px] text-text hover:border-accent transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const services = data ?? []

  // ── Empty state ────────────────────────────────────────────────────────────

  if (services.length === 0) {
    return (
      <div className="max-w-[390px] mx-auto px-5 py-6 lg:max-w-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-syne font-extrabold text-[20px] text-text">Services</h1>
            <p className="text-[12px] text-muted mt-0.5">Aucun service créé pour le moment</p>
          </div>
          {isManager && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-accent text-white text-[12px] font-bold px-3 py-2 rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
            >
              <span className="text-[16px] leading-none">+</span>
              Nouveau
            </button>
          )}
        </div>

        <div className="bg-surface border border-border rounded-[18px] p-10 text-center">
          <p className="text-[36px] mb-3">📅</p>
          <p className="text-text font-syne font-bold text-[15px]">
            Aucun service planifié
          </p>
          <p className="text-muted text-[12px] mt-1.5 mb-5">
            Les services créés apparaîtront ici, triés par date.
          </p>
          {isManager && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-accent text-white font-syne font-bold text-[13px] rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
            >
              Créer le premier service
            </button>
          )}
        </div>

        {isManager && (
          <ModalCreateService
            open={showCreate}
            onClose={() => setShowCreate(false)}
          />
        )}
      </div>
    )
  }

  // ── Liste ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[390px] mx-auto px-5 py-6 lg:max-w-2xl pb-28">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-syne font-extrabold text-[20px] text-text">Services</h1>
          <p className="text-[12px] text-muted mt-0.5">
            {services.length} service{services.length > 1 ? 's' : ''} · triés par date
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-accent text-white text-[12px] font-bold px-3 py-2 rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
          >
            <span className="text-[16px] leading-none">+</span>
            Nouveau
          </button>
        )}
      </div>

      {/* Cartes (date décroissante — déjà triées par le backend) */}
      <motion.div
        className="flex flex-col gap-3"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {services.map(service => (
          <motion.div key={service.id} variants={listItemVariants}>
            <ServiceCard
              service={service}
              isManager={!!isManager}
              onDelete={isManager ? (id) => {
                if (window.confirm('Supprimer ce service ? Cette action est irréversible.')) {
                  deleteService(id)
                }
              } : undefined}
              onAddNote={isManager
                ? (id, note) => addNote({ serviceId: id, note })
                : undefined
              }
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Modal création */}
      {isManager && (
        <ModalCreateService
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
