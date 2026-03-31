'use client'

import { useState, useRef }        from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { fr }               from 'date-fns/locale'
import { expandVariants }   from '@/lib/animations'
import { cn }               from '@/lib/cn'
import { ty }               from '@/lib/typography'
import { useDeletePoste }   from '@/hooks/useService'
import type { ServiceListItem } from '@/types/index'
import ModalAssignerPoste          from '@/components/services/ModalAssignerPoste'

// ─── Badge statut dynamique ───────────────────────────────────────────────────

type BadgeType = 'termine' | 'en_cours' | 'planifie'

// Mapping direct depuis le statut BDD — ne pas recalculer depuis la date
function resolveBadge(service: ServiceListItem): BadgeType {
  if (service.statut === 'EN_COURS') return 'en_cours'
  if (service.statut === 'TERMINE')  return 'termine'
  return 'planifie'
}

const BADGE_LABEL: Record<BadgeType, string> = {
  termine:  'Terminé',
  en_cours: 'En cours',
  planifie: 'Planifié',
}

const BADGE_CLASS: Record<BadgeType, string> = {
  termine:  'bg-[rgba(34,197,94,0.1)] text-green border border-[rgba(34,197,94,0.2)]',
  en_cours: 'bg-[rgba(249,115,22,0.12)] text-accent border border-[rgba(249,115,22,0.25)]',
  planifie: 'bg-[rgba(59,130,246,0.1)] text-blue border border-[rgba(59,130,246,0.2)]',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  service:    ServiceListItem
  isManager:  boolean
  onDelete?:  (id: number) => void
  onAddNote?: (id: number, note: string) => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ServiceCard({ service, isManager, onDelete, onAddNote }: Props) {
  const [expanded,    setExpanded]    = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue,   setNoteValue]   = useState(service.note ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // État modale assignation poste
  const [modalOpen,       setModalOpen]       = useState(false)
  const [modalPreZoneId,  setModalPreZoneId]  = useState<number | null>(null)

  const { mutate: deletePoste } = useDeletePoste()

  const badge     = resolveBadge(service)
  const canEdit   = isManager && badge === 'planifie'
  const canDelete = canEdit

  const dateLabel = (() => {
    try { return format(parseISO(service.date), 'EEEE d MMMM yyyy', { locale: fr }) }
    catch { return service.date }
  })()

  function handleSaveNote() {
    onAddNote?.(service.id, noteValue)
    setEditingNote(false)
  }

  function handleStartEdit() {
    setEditingNote(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function openModalForZone(zoneId: number | null) {
    setModalPreZoneId(zoneId)
    setModalOpen(true)
  }

  return (
    <>
      <div
        className={cn(
          'bg-surface border rounded-[18px] overflow-hidden transition-colors',
          badge === 'en_cours' ? 'border-accent/30' : 'border-border',
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <button
          className="w-full text-left p-4"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className={`${ty.cardTitleMd} capitalize`}>
                {dateLabel}
              </div>
              {(service.heureDebut || service.heureFin) && (
                <div className={`${ty.meta} mt-0.5`}>
                  {service.heureDebut ?? '?'}h – {service.heureFin ?? '?'}h
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px]',
                BADGE_CLASS[badge],
              )}>
                {badge === 'en_cours' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                  </span>
                )}
                {BADGE_LABEL[badge]}
              </span>
              <span className={ty.meta}>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* Barre de progression */}
          <div>
            <div className="h-[5px] bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-orange-400 rounded-full transition-all"
                style={{ width: `${service.tauxCompletion}%` }}
              />
            </div>
            <div className={`${ty.metaSm} mt-1`}>{service.tauxCompletion}% complété</div>
          </div>

          {/* Avatars staff */}
          {service.staff.length > 0 && (
            <div className="flex items-center gap-1 mt-3">
              {service.staff.slice(0, 5).map((member, i) => (
                <div
                  key={member.id}
                  title={member.nom}
                  className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-extrabold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${member.avatarColor}, ${member.avatarColor}cc)`,
                    marginLeft: i > 0 ? '-4px' : 0,
                    zIndex:     10 - i,
                    position:   'relative',
                  }}
                >
                  {member.nom.charAt(0).toUpperCase()}
                </div>
              ))}
              {service.staff.length > 5 && (
                <span className={`${ty.metaSm} ml-1`}>+{service.staff.length - 5}</span>
              )}
              <span className={`${ty.meta} ml-2`}>
                {service.staff.length} membre{service.staff.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </button>

        {/* ── Contenu étendu ──────────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="expanded"
              variants={expandVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-4">

                {/* ── Section Zones & Staff (MANAGER + PLANIFIE uniquement) ───── */}
                {canEdit && (
                  <div className="flex flex-col gap-2">
                    <p className={`${ty.labelMuted} uppercase tracking-wide`}>
                      Zones & Staff
                    </p>

                    {/* Zones déjà assignées */}
                    {service.zones.map(zone => (
                      <div
                        key={zone.id}
                        className="bg-surface2 border border-border rounded-[12px] px-3 py-2.5"
                      >
                        {/* Nom de la zone */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: zone.couleur }}
                            />
                            <span className={`${ty.metaLg} font-semibold text-text`}>
                              {zone.nom}
                            </span>
                          </div>
                        </div>

                        {/* Badges staff assignés */}
                        <div className="flex flex-wrap gap-1.5">
                          {zone.postes.length === 0 && (
                            <span className={`${ty.meta} italic`}>Aucun membre assigné</span>
                          )}
                          {zone.postes.map(poste => (
                            <div
                              key={poste.posteId}
                              className="flex items-center gap-1.5 bg-surface border border-border rounded-full pl-1.5 pr-2 py-0.5"
                            >
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${poste.avatarColor}, ${poste.avatarColor}cc)` }}
                              >
                                {poste.nom.charAt(0).toUpperCase()}
                              </div>
                              <span className={ty.meta + ' text-text'}>{poste.nom}</span>
                              <button
                                onClick={() => deletePoste(poste.posteId)}
                                className="text-muted hover:text-red transition-colors text-[13px] leading-none ml-0.5"
                                title="Retirer"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Bouton ajouter une nouvelle zone */}
                    <button
                      onClick={() => openModalForZone(null)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[12px] border border-dashed border-border text-[12px] text-muted hover:text-text hover:border-accent/40 transition-all"
                    >
                      <span className="text-[16px] leading-none">+</span>
                      Assigner un staff à une zone
                    </button>
                  </div>
                )}

                {/* ── Progression par zone (lecture seule, tous statuts) ───────── */}
                {service.zones.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className={`${ty.labelMuted} uppercase tracking-wide`}>
                      Progression
                    </p>
                    {service.zones.map(zone => (
                      <div key={zone.id} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: zone.couleur }}
                        />
                        <span className={`${ty.body} flex-1 leading-none`}>{zone.nom}</span>
                        <div className="flex items-center gap-2 w-28">
                          <div className="flex-1 h-[4px] bg-surface2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${zone.taux}%`, backgroundColor: zone.couleur }}
                            />
                          </div>
                          <span className={`${ty.metaSm} w-8 text-right`}>{zone.taux}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Note ─────────────────────────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <p className={`${ty.labelMuted} uppercase tracking-wide`}>Note</p>
                    {isManager && !editingNote && (
                      <button
                        onClick={handleStartEdit}
                        className="text-[11px] text-accent hover:opacity-80 transition-opacity"
                      >
                        {service.note ? 'Modifier' : '+ Ajouter'}
                      </button>
                    )}
                  </div>

                  {editingNote ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        ref={textareaRef}
                        value={noteValue}
                        onChange={e => setNoteValue(e.target.value)}
                        rows={3}
                        placeholder="Note sur ce service…"
                        className="w-full bg-surface2 border border-border rounded-[10px] px-3 py-2.5 text-[13px] text-text resize-none focus:outline-none focus:border-accent transition-colors"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNote}
                          className="flex-1 py-2 rounded-[10px] bg-accent text-white text-[12px] font-bold hover:bg-accent/90 transition-colors"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => { setNoteValue(service.note ?? ''); setEditingNote(false) }}
                          className="flex-1 py-2 rounded-[10px] bg-surface2 text-muted text-[12px] hover:text-text transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : service.note ? (
                    <div className="bg-surface2 border border-border rounded-[12px] px-3.5 py-3 flex gap-2.5">
                      <span className="text-[16px] shrink-0">📝</span>
                      <p className={`${ty.bodyLg} leading-relaxed`}>{service.note}</p>
                    </div>
                  ) : isManager ? null : (
                    <p className={`${ty.bodyLg} text-muted italic`}>Aucune note pour ce service.</p>
                  )}
                </div>

                {/* ── Suppression ──────────────────────────────────────────────── */}
                {canDelete && (
                  <div className="flex justify-end pt-1 border-t border-border">
                    <button
                      onClick={() => onDelete?.(service.id)}
                      className={`${ty.meta} text-red/60 hover:text-red transition-colors mt-2`}
                    >
                      Supprimer ce service
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modale assignation poste ──────────────────────────────────────────── */}
      <ModalAssignerPoste
        open={modalOpen}
        service={service}
        zoneId={modalPreZoneId}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
