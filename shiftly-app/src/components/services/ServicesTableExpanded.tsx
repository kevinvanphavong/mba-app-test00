'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { expandVariants } from '@/lib/animations'
import { useDeletePoste } from '@/hooks/useService'
import { getGradientFromColor, hexAlpha } from '@/lib/colors'
import { getInitials, getDisplayName } from '@/lib/userDisplay'
import type { ServiceListItem, ServiceListZone } from '@/types/index'
import ServiceHoursEditor from '@/components/services/ServiceHoursEditor'

interface ServicesTableExpandedProps {
  service:    ServiceListItem
  isLast:     boolean
  /** Manager avec droits édition (statut PLANIFIE ou EN_COURS) */
  canEdit:    boolean
  /** Sauvegarde la note (`useAddServiceNote().mutate` côté parent) */
  onSaveNote: (note: string) => void
  /** Ouvre la modale d'assignation pré-paramétrée sur une zone */
  onAssign:   (zoneId: number) => void
}

const SECTION_LABEL = 'text-[10px] font-syne font-bold uppercase tracking-[1.5px] text-muted'

/**
 * Panneau dépliant d'une ligne de service — 3 sections :
 *  1. Zones & Staff (manager + planifie/en_cours uniquement)
 *  2. Progression (toujours visible si zones non vides)
 *  3. Note (lecture/édition, useAddServiceNote)
 */
export default function ServicesTableExpanded({
  service, isLast, canEdit, onSaveNote, onAssign,
}: ServicesTableExpandedProps) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue,   setNoteValue]   = useState(service.note ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { mutate: deletePoste } = useDeletePoste()

  function handleSaveNote() {
    onSaveNote(noteValue)
    setEditingNote(false)
  }

  function handleStartEdit() {
    setEditingNote(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <motion.div
      variants={expandVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={`overflow-hidden bg-bg ${isLast ? '' : 'border-b border-border'}`}
    >
      <div className="px-6 py-5 flex flex-col gap-6">

        {/* ── Horaires (édition inline pour manager + PLANIFIE/EN_COURS) ───── */}
        <section>
          <p className={`${SECTION_LABEL} mb-2.5`}>Horaires</p>
          <div className="max-w-[320px]">
            <ServiceHoursEditor
              serviceId={service.id}
              heureDebut={service.heureDebut ?? null}
              heureFin={service.heureFin ?? null}
              canEdit={canEdit}
              variant="table"
            />
          </div>
        </section>

        {/* ── Zones & Staff (manager only) ──────────────────────────────────── */}
        {canEdit && service.zones.length > 0 && (
          <section>
            <p className={`${SECTION_LABEL} mb-3.5`}>Zones &amp; Staff</p>
            <div className="flex flex-col gap-3">
              {service.zones.map(zone => (
                <ZoneRow
                  key={zone.id}
                  zone={zone}
                  onAddMember={() => onAssign(zone.id)}
                  onRemoveMember={posteId => deletePoste(posteId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Progression ───────────────────────────────────────────────────── */}
        {service.zones.length > 0 && (
          <section>
            <p className={`${SECTION_LABEL} mb-3.5`}>Progression</p>
            <div className="flex flex-col gap-2.5">
              {service.zones.map(zone => (
                <div
                  key={zone.id}
                  className="grid grid-cols-[160px_1fr_50px] items-center gap-3.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: zone.couleur }}
                    />
                    <span className="text-[13px] text-text font-medium truncate">{zone.nom}</span>
                  </div>
                  <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-400"
                      style={{ width: `${zone.taux}%`, background: zone.couleur }}
                    />
                  </div>
                  <div className="font-syne text-[12px] text-muted font-semibold text-right">
                    {zone.taux}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Note ──────────────────────────────────────────────────────────── */}
        <section className="pt-3.5 border-t border-border">
          <div className="flex items-center justify-between mb-2.5">
            <p className={SECTION_LABEL}>Note</p>
            {!editingNote && !service.note && canEdit && (
              <button
                onClick={handleStartEdit}
                className="text-[12px] font-bold text-accent hover:text-accent/80"
              >
                + Ajouter
              </button>
            )}
            {!editingNote && service.note && canEdit && (
              <button
                onClick={handleStartEdit}
                className="text-[12px] font-bold text-accent hover:text-accent/80"
              >
                Modifier
              </button>
            )}
            {editingNote && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingNote(false); setNoteValue(service.note ?? '') }}
                  className="text-[11px] font-semibold text-muted border border-border rounded-[7px] px-2.5 py-1 hover:text-text"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNote}
                  className="text-[11px] font-bold text-white bg-accent rounded-[7px] px-2.5 py-1 hover:bg-accent/90"
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>

          {editingNote && (
            <textarea
              ref={textareaRef}
              value={noteValue}
              onChange={e => setNoteValue(e.target.value)}
              placeholder="Ajoute une note pour ce service (consignes, événement spécial, infos staff…)"
              className="w-full min-h-[78px] bg-surface border border-border rounded-[10px] px-3 py-2.5 text-[12px] text-text leading-relaxed outline-none focus:border-accent/50 resize-y"
            />
          )}
          {!editingNote && service.note && (
            <div className="bg-surface border border-border rounded-[10px] px-3 py-2.5 text-[12px] text-text leading-relaxed whitespace-pre-wrap">
              {service.note}
            </div>
          )}
          {!editingNote && !service.note && !canEdit && (
            <p className="text-[12px] text-muted italic">Aucune note pour ce service.</p>
          )}
        </section>
      </div>
    </motion.div>
  )
}

// ─── Sous-composant : ligne d'une zone (chips membres + bouton "+ Membre") ───

interface ZoneRowProps {
  zone:           ServiceListZone
  onAddMember:    () => void
  onRemoveMember: (posteId: number) => void
}

function ZoneRow({ zone, onAddMember, onRemoveMember }: ZoneRowProps) {
  const tintBg     = hexAlpha(zone.couleur, 0.10)
  const tintBorder = hexAlpha(zone.couleur, 0.30)

  return (
    <div className="bg-surface border border-border rounded-[14px] px-4 py-3 flex items-center gap-3.5 flex-wrap">
      {/* Identité zone */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: zone.couleur }} />
        <span className="font-syne text-[12px] font-semibold text-text">{zone.nom}</span>
        <span className="text-[11px] text-muted font-semibold">· {zone.postes.length}</span>
      </div>

      {/* Chips membres */}
      <div className="flex gap-2 flex-wrap flex-1 min-w-[160px]">
        {zone.postes.length === 0 && (
          <span className="text-[11px] text-muted italic py-1">Aucun membre assigné</span>
        )}
        {zone.postes.map(p => (
          <div
            key={p.posteId}
            className="inline-flex items-center gap-1.5 bg-surface2 border border-border rounded-full pl-1 pr-2 py-0.5"
          >
            <span
              className="w-6 h-6 rounded-[6px] flex items-center justify-center font-syne font-semibold text-[8px] text-white"
              style={{ background: getGradientFromColor(p.avatarColor) }}
            >
              {getInitials(p.nom, p.prenom)}
            </span>
            <span className="text-[12px] text-text font-medium">
              {getDisplayName(p.nom, p.prenom)}
            </span>
            <button
              title="Retirer"
              onClick={() => onRemoveMember(p.posteId)}
              className="text-muted hover:text-red text-[13px] leading-none ml-0.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* + Membre tinté zone */}
      <button
        onClick={onAddMember}
        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-opacity hover:opacity-80"
        style={{
          background: tintBg,
          border:     `1px solid ${tintBorder}`,
          color:      zone.couleur,
        }}
      >
        + Membre
      </button>
    </div>
  )
}
