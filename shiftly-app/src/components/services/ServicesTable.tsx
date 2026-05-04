'use client'

import { Fragment } from 'react'
import { AnimatePresence } from 'framer-motion'
import ServicesTableHeader from '@/components/services/ServicesTableHeader'
import ServicesTableRow from '@/components/services/ServicesTableRow'
import ServicesTableExpanded from '@/components/services/ServicesTableExpanded'
import type { ServiceListItem } from '@/types/index'
import type { TabKey } from '@/lib/serviceFilters'

interface ServicesTableProps {
  services:    ServiceListItem[]
  tab:         TabKey
  isManager:   boolean
  expandedId:  number | null
  onToggle:    (id: number) => void
  onDelete:    (serviceId: number) => void
  onSaveNote:  (serviceId: number, note: string) => void
  onAssign:    (service: ServiceListItem, zoneId: number) => void
}

/**
 * Tableau /services (vue desktop). Header sticky + lignes cliquables + dépliant
 * animé via Framer Motion (`expandVariants`).
 *
 * État vide géré ici : aucun service après filtrage onglet/période.
 */
export default function ServicesTable({
  services, tab, isManager, expandedId, onToggle, onDelete, onSaveNote, onAssign,
}: ServicesTableProps) {
  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden">
      {/* Scroll horizontal sur viewport étroit : la grille a une largeur min
          pour préserver l'alignement des colonnes (sinon les bulles d'avatar
          + ZoneTags se chevauchent quand l'écran rétrécit). */}
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <ServicesTableHeader />

          {services.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-muted">
              Aucun service sur cette période.
            </div>
          ) : (
            services.map((service, idx) => {
              const isOpen   = expandedId === service.id
              const isLast   = idx === services.length - 1
              const canEdit  = isManager && (service.statut === 'PLANIFIE' || service.statut === 'EN_COURS')
              // Suppression réservée aux services à venir (PLANIFIE) — cohérent avec mobile
              const canDelete = isManager && service.statut === 'PLANIFIE'
              return (
                <Fragment key={service.id}>
                  <ServicesTableRow
                    service={service}
                    tab={tab}
                    isOpen={isOpen}
                    isLast={isLast}
                    onToggle={() => onToggle(service.id)}
                  />
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <ServicesTableExpanded
                        service={service}
                        isLast={isLast}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onDelete={() => onDelete(service.id)}
                        onSaveNote={note => onSaveNote(service.id, note)}
                        onAssign={zoneId => onAssign(service, zoneId)}
                      />
                    )}
                  </AnimatePresence>
                </Fragment>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
