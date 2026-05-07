'use client'

/**
 * MemberPanel — Section dépliée d'un membre :
 *   1. SkillCardsByZone (compétences groupées, toggle pour manager)
 *   2. info-row (contrat / tutoriels / tenue)
 *   3. actions-row (modifier / désactiver / ajouter compétence)
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
  onDeactivate:     () => void
  onScrollAddSkill: (firstNonAcquiredId: number | null) => void
}

export default function MemberPanel({
  member, meta, isManager, isSelf, highlightCompId, onEdit, onDeactivate, onScrollAddSkill,
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

  function handleAddSkill() {
    const firstNon = meta.competencesCatalog.find(c => !acquisIds.has(c.id))
    skillsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    onScrollAddSkill(firstNon?.id ?? null)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="staff-member-panel"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Compétences par zone */}
      <div ref={skillsRef} className="panel-section">
        <div className="panel-label">Compétences par zone</div>
        <SkillCardsByZone
          userId={member.id}
          catalog={meta.competencesCatalog}
          acquisIds={acquisIds}
          canEdit={isManager}
          highlightCompId={highlightCompId}
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
          <div className="mt-2 h-1.5 rounded-full bg-surface overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${tutoPct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
          </div>
        </div>

        <div className="info-card">
          <div className="panel-label">Tenue de service</div>
          {(meta.tenueHaut || meta.tenueBas || meta.tenueChaussures) ? (
            <div className="flex items-start gap-2 text-[12px] text-text">
              <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-[14px] flex-shrink-0">👕</div>
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
        <div className="panel-section flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {isManager && <button onClick={onEdit} className="btn-staff-secondary">✎ Modifier la fiche</button>}
            {isSelf && !isManager && (
              <a href="/reglages" className="btn-staff-secondary inline-flex items-center">✎ Modifier mon profil</a>
            )}
            {isManager && (
              <button onClick={handleAddSkill} className="btn-staff-secondary">+ Ajouter une compétence</button>
            )}
          </div>
          {isManager && member.actif && (
            <button onClick={onDeactivate} className="btn-staff-danger">⊘ Désactiver</button>
          )}
        </div>
      )}
    </motion.div>
  )
}
