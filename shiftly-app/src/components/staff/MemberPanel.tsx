'use client'

/**
 * MemberPanel — Section dépliée d'un membre :
 *   0. Bandeau "Membre désactivé" si !member.actif
 *   1. SkillCardsByZone (compétences groupées, toggle pour manager)
 *   2. info-row (contrat / tutoriels / tenue)
 *   3. actions-row (modifier / désactiver|réactiver / ajouter compétence)
 *
 * Animation : height 0 ↔ auto + opacity via Framer Motion. Le mount/unmount
 * est piloté par <AnimatePresence> côté parent (staff/page.tsx), keyé sur
 * member.id pour qu'un changement de membre déplié déclenche un exit propre
 * sans chevauchement de panneaux.
 */

import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import SkillCardsByZone from './SkillCardsByZone'
import { calculerAnciennete } from '@/lib/staff'
import type { StaffMember, StaffMeta } from '@/types/staff'

interface Props {
  member:           StaffMember
  meta:             StaffMeta
  isManager:        boolean
  isSelf:           boolean
  highlightCompId:  number | null
  onEdit:           () => void
  onToggleActif:    () => void
  onScrollAddSkill: (firstNonAcquiredId: number | null) => void
}

export default function MemberPanel({
  member, meta, isManager, isSelf, highlightCompId, onEdit, onToggleActif, onScrollAddSkill,
}: Props) {
  const skillsRef = useRef<HTMLDivElement>(null)

  // Map { competenceId → staffCompetenceId } pour résoudre l'acquis O(1)
  const acquisIds = useMemo(() => {
    const m = new Map<number, number>()
    for (const sc of member.staffCompetences) m.set(sc.competenceId, sc.id)
    return m
  }, [member.staffCompetences])

  const exposeContract = isManager || isSelf
  const anciennete     = calculerAnciennete(member.dateEmbauche)
  const tutoPct        = meta.tutorielsTotal > 0 ? Math.round(member.tutorielsLus / meta.tutorielsTotal * 100) : 0
  const inactive       = !member.actif

  function handleAddSkill() {
    const firstNon = meta.competencesCatalog.find(c => !acquisIds.has(c.id))
    skillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    onScrollAddSkill(firstNon?.id ?? null)
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'hidden' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="staff-member-panel">
        {inactive && (
          <div className="staff-inactive-notice">
            <div><b>Membre désactivé.</b> Il ne peut plus se connecter, mais sa fiche et son historique restent consultables.</div>
          </div>
        )}

        {/* Compétences par zone */}
        <div ref={skillsRef} className="panel-section">
          <div className="panel-label">Compétences par zone</div>
          <SkillCardsByZone
            userId={member.id}
            catalog={meta.competencesCatalog}
            acquisIds={acquisIds}
            canEdit={isManager}
            highlightCompId={highlightCompId}
            inactive={inactive}
          />
        </div>

        {/* Info row : contrat / tutos / tenue */}
        <div className="panel-section info-row">
          <div className="info-card">
            <div className="panel-label">Contrat</div>
            {exposeContract ? (
              <>
                <div className="text-[14px] font-bold text-text">
                  {member.typeContrat ?? '—'}
                  {member.heuresHebdo != null && ` · ${member.heuresHebdo}h`}
                </div>
                {anciennete && <div className="text-[11px] text-muted mt-1">Ancienneté · {anciennete}</div>}
              </>
            ) : (
              <div className="text-[12px] text-muted italic">Information non visible</div>
            )}
          </div>

          <div className="info-card">
            <div className="panel-label">Tutoriels lus</div>
            <div className="font-syne font-extrabold text-[22px] text-text leading-none">
              {member.tutorielsLus} <span className="text-[12px] text-muted font-semibold">sur {meta.tutorielsTotal}</span>
            </div>
            <div className="mt-2.5 h-[5px] rounded-[3px] bg-surface overflow-hidden">
              <div className="h-full rounded-[3px]"
                   style={{ width: `${tutoPct}%`, background: inactive ? 'var(--muted)' : 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
            </div>
          </div>

          <div className="info-card">
            <div className="panel-label">Tenue de service</div>
            {(meta.tenueHaut || meta.tenueBas || meta.tenueChaussures) ? (
              <div className="flex items-center gap-2.5 text-[12px] text-text">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-[16px] flex-shrink-0">👕</div>
                <div className="leading-snug">
                  {[meta.tenueHaut, meta.tenueBas, meta.tenueChaussures].filter(Boolean).join(' · ')}
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-muted italic">Aucune tenue configurée</div>
            )}
          </div>
        </div>

        {/* Actions */}
        {(isManager || isSelf) && (
          <div className="panel-section flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex gap-2 flex-wrap">
              {isManager && <button onClick={onEdit} className="btn-staff-secondary">Modifier la fiche</button>}
              {isSelf && !isManager && (
                <a href="/reglages" className="btn-staff-secondary inline-flex items-center">Modifier mon profil</a>
              )}
              {isManager && !inactive && (
                <button onClick={handleAddSkill} className="btn-staff-secondary">Ajouter une compétence</button>
              )}
            </div>
            {isManager && (
              <button onClick={onToggleActif} className={inactive ? 'btn-staff-reactivate' : 'btn-staff-danger'}>
                {inactive ? 'Réactiver' : 'Désactiver'}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
