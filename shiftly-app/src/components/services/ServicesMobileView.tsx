'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { listVariants, listItemVariants } from '@/lib/animations'
import { ty } from '@/lib/typography'
import { cn } from '@/lib/cn'
import ServiceCard from '@/components/services/ServiceCard'
import type { ServiceListItem } from '@/types/index'

interface ServicesMobileViewProps {
  services:        ServiceListItem[]
  isManager:       boolean
  onDelete:        (id: number) => void
  onAddNote:       (id: number, note: string) => void
  onOpenCreate:    () => void
}

const LIMITS = [10, 20, 50]

/**
 * Vue mobile /services — sections « Aujourd'hui / À venir / Passés ».
 * Comportement inchangé par rapport à la version pré-refonte desktop.
 */
export default function ServicesMobileView({
  services, isManager, onDelete, onAddNote, onOpenCreate,
}: ServicesMobileViewProps) {
  const [limitPasse, setLimitPasse] = useState(10)

  const todayStr       = new Date().toISOString().slice(0, 10)
  const todayService   = services.find(s => s.date === todayStr)
  const futureServices = services.filter(s => s.date > todayStr)
  const pastServices   = services.filter(s => s.date < todayStr)

  // Empty state
  if (services.length === 0) {
    return (
      <div className="mx-auto px-5 py-6 lg:max-w-2xl">
        {isManager && (
          <div className="flex items-center justify-end mb-5">
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 bg-accent text-white text-[12px] font-bold px-3 py-2 rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
            >
              <span className="text-[16px] leading-none">+</span>
              Nouveau
            </button>
          </div>
        )}
        <div className="bg-surface border border-border rounded-[18px] p-10 text-center">
          <p className="text-[36px] mb-3">📅</p>
          <p className={ty.kpiSm}>Aucun service planifié</p>
          <p className={`${ty.metaLg} mt-1.5 mb-5`}>
            Les services créés apparaîtront ici, triés par date.
          </p>
          {isManager && (
            <button
              onClick={onOpenCreate}
              className="px-5 py-2.5 bg-accent text-white font-syne font-bold text-[13px] rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
            >
              Créer le premier service
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto px-5 py-6 lg:max-w-2xl pb-28">
      {isManager && (
        <div className="flex items-center justify-end mb-5">
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 bg-accent text-white text-[12px] font-bold px-3 py-2 rounded-[12px] hover:bg-accent/90 active:scale-[0.97] transition-all"
          >
            <span className="text-[16px] leading-none">+</span>
            Nouveau
          </button>
        </div>
      )}

      {todayService && (
        <div className="mb-5">
          <p className={`${ty.labelMuted} uppercase tracking-wide mb-2`}>Aujourd&apos;hui</p>
          <ServiceCard
            service={todayService}
            isManager={isManager}
            onDelete={isManager ? onDelete : undefined}
            onAddNote={isManager ? onAddNote : undefined}
          />
        </div>
      )}

      {futureServices.length > 0 && (
        <div className="mb-5">
          <p className={`${ty.labelMuted} uppercase tracking-wide mb-2`}>À venir</p>
          <motion.div className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="show">
            {futureServices.map(s => (
              <motion.div key={s.id} variants={listItemVariants}>
                <ServiceCard
                  service={s}
                  isManager={isManager}
                  onDelete={isManager ? onDelete : undefined}
                  onAddNote={isManager ? onAddNote : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {pastServices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={`${ty.labelMuted} uppercase tracking-wide`}>Passés</p>
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
          <motion.div className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="show">
            {pastServices.slice(0, limitPasse).map(s => (
              <motion.div key={s.id} variants={listItemVariants}>
                <ServiceCard
                  service={s}
                  isManager={isManager}
                  onDelete={isManager ? onDelete : undefined}
                  onAddNote={isManager ? onAddNote : undefined}
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
    </div>
  )
}
