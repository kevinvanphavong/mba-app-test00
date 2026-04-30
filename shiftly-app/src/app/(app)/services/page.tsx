'use client'

import { useState }             from 'react'
import { motion }               from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import { useAuthStore }         from '@/store/authStore'
import { ty }                    from '@/lib/typography'
import { cn }                    from '@/lib/cn'
import { useServicesList, useDeleteService, useAddServiceNote } from '@/hooks/useService'
import { useCurrentUser }       from '@/hooks/useCurrentUser'
import Topbar              from '@/components/layout/Topbar'
import ServiceCard         from '@/components/services/ServiceCard'
import ModalCreateService  from '@/components/services/ModalCreateService'

// ─── Page Planning ────────────────────────────────────────────────────────────

const LIMITS = [10, 20, 50]

export default function ServicesPage() {
  const isManager  = useAuthStore(s => s.user?.role === 'MANAGER')
  const centreId   = useAuthStore(s => s.centreId)
  const { user }   = useCurrentUser()

  const { data, isLoading, isError, refetch } = useServicesList()

  const { mutate: deleteService } = useDeleteService()
  const { mutate: addNote }       = useAddServiceNote()

  const [showCreate,  setShowCreate]  = useState(false)
  const [limitPasse,  setLimitPasse]  = useState(10)

  const servicesCount = data?.length ?? 0
  const topSubtitle   = [
    user?.centre?.nom,
    `${servicesCount} service${servicesCount > 1 ? 's' : ''}`,
    'triés par date',
  ].filter(Boolean).join(' · ')

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!centreId || isLoading) {
    return (
      <>
        <Topbar title="Services" subtitle={user?.centre?.nom ?? ''} />
        <div className="mx-auto px-5 py-6 lg:max-w-2xl">
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
      </>
    )
  }

  // ── Erreur ─────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <>
        <Topbar title="Services" subtitle={user?.centre?.nom ?? ''} />
        <div className="mx-auto px-5 py-6 lg:max-w-2xl">
          <div className="bg-surface border border-red/20 rounded-[18px] p-8 text-center">
            <p className="text-[28px] mb-2">⚠️</p>
            <p className={`${ty.cardTitleMd} text-red font-bold`}>Erreur de chargement</p>
            <p className={`${ty.metaLg} mt-1 mb-4`}>
              Impossible de récupérer le planning.
            </p>
            <button
              onClick={() => refetch()}
              className={`${ty.body} px-4 py-2 bg-surface2 border border-border rounded-[10px] hover:border-accent transition-colors`}
            >
              Réessayer
            </button>
          </div>
        </div>
      </>
    )
  }

  const services       = data ?? []
  const todayStr       = new Date().toISOString().slice(0, 10)
  const todayService   = services.find(s => s.date === todayStr)
  const futureServices = services.filter(s => s.date > todayStr)
  const pastServices   = services.filter(s => s.date < todayStr)

  // ── Empty state ────────────────────────────────────────────────────────────

  if (services.length === 0) {
    return (
      <>
        <Topbar title="Services" subtitle={user?.centre?.nom ?? ''} />
        <div className="mx-auto px-5 py-6 lg:max-w-2xl">
          {isManager && (
            <div className="flex items-center justify-end mb-5">
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 bg-accent text-white text-[12px] font-bold px-3 py-2 rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
              >
                <span className="text-[16px] leading-none">+</span>
                Nouveau
              </button>
            </div>
          )}

        <div className="bg-surface border border-border rounded-[18px] p-10 text-center">
          <p className="text-[36px] mb-3">📅</p>
          <p className={ty.kpiSm}>
            Aucun service planifié
          </p>
          <p className={`${ty.metaLg} mt-1.5 mb-5`}>
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
      </>
    )
  }

  // ── Handlers partagés ──────────────────────────────────────────────────────

  function handleDelete(id: number) {
    if (window.confirm('Supprimer ce service ? Cette action est irréversible.')) {
      deleteService(id)
    }
  }

  function handleNote(id: number, note: string) {
    addNote({ serviceId: id, note })
  }

  // ── Liste ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Topbar title="Services" subtitle={topSubtitle} />
      <div className="mx-auto px-5 py-6 lg:max-w-2xl pb-28">
        {isManager && (
          <div className="flex items-center justify-end mb-5">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-accent text-white text-[12px] font-bold px-3 py-2 rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
            >
              <span className="text-[16px] leading-none">+</span>
              Nouveau
            </button>
          </div>
        )}

      {/* ── Aujourd'hui ─────────────────────────────────────────────────────── */}
      {todayService && (
        <div className="mb-5">
          <p className={`${ty.labelMuted} uppercase tracking-wide mb-2`}>
            Aujourd'hui
          </p>
          <ServiceCard
            service={todayService}
            isManager={!!isManager}
            onDelete={isManager ? handleDelete : undefined}
            onAddNote={isManager ? handleNote : undefined}
          />
        </div>
      )}

      {/* ── À venir ──────────────────────────────────────────────────────────── */}
      {futureServices.length > 0 && (
        <div className="mb-5">
          <p className={`${ty.labelMuted} uppercase tracking-wide mb-2`}>
            À venir
          </p>
          <motion.div
            className="flex flex-col gap-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {futureServices.map(service => (
              <motion.div key={service.id} variants={listItemVariants}>
                <ServiceCard
                  service={service}
                  isManager={!!isManager}
                  onDelete={isManager ? handleDelete : undefined}
                  onAddNote={isManager ? handleNote : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── Passés ───────────────────────────────────────────────────────────── */}
      {pastServices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={`${ty.labelMuted} uppercase tracking-wide`}>
              Passés
            </p>
            {/* Sélecteur de limite en pastilles */}
            <div className="flex items-center gap-1.5">
              {LIMITS.map(n => (
                <button
                  key={n}
                  onClick={() => setLimitPasse(n)}
                  className={cn(
                    'w-7 h-7 rounded-full text-[11px] font-bold transition-all',
                    limitPasse === n
                      ? 'bg-accent text-white'
                      : 'bg-surface2 border border-border text-muted hover:text-text',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <motion.div
            className="flex flex-col gap-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {pastServices.slice(0, limitPasse).map(service => (
              <motion.div key={service.id} variants={listItemVariants}>
                <ServiceCard
                  service={service}
                  isManager={!!isManager}
                  onDelete={isManager ? handleDelete : undefined}
                  onAddNote={isManager ? handleNote : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
          {pastServices.length > limitPasse && (
            <p className={`${ty.metaLg} text-center mt-3`}>
              {pastServices.length - limitPasse} service{pastServices.length - limitPasse > 1 ? 's' : ''} masqué{pastServices.length - limitPasse > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Modal création */}
      {isManager && (
        <ModalCreateService
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
      </div>
    </>
  )
}
