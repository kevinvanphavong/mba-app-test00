'use client'

/**
 * SkillTag — pastille de compétence cliquable (manager) ou en lecture seule (employé).
 * Toggle direct via POST/DELETE /editeur/staff/:id/competences. Optimistic update via
 * invalidation de la query ['staff'] après succès.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Props {
  userId:            number
  competenceId:      number
  staffCompetenceId: number | null   // null si non acquise
  nom:               string
  zoneCouleur:       string
  acquis:            boolean
  /** false = lecture seule (employé) — clic sans effet, pas de hover */
  canEdit:           boolean
  /** Highlight pulsant 1.5s — déclenché par "Ajouter une compétence" */
  highlight?:        boolean
  /** Membre inactif : tags désaturés (neutres) quelle que soit la valeur d'acquis */
  inactive?:         boolean
}

export default function SkillTag({
  userId, competenceId, staffCompetenceId, nom, zoneCouleur, acquis, canEdit, highlight = false, inactive = false,
}: Props) {
  const queryClient = useQueryClient()
  const centreId    = useAuthStore(s => s.centreId)

  const grant = useMutation({
    mutationFn: () => api.post(`/editeur/staff/${userId}/competences`, { competenceId }).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['staff', centreId] }),
  })

  const revoke = useMutation({
    mutationFn: () => api.delete(`/editeur/staff/${userId}/competences/${staffCompetenceId}`).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['staff', centreId] }),
  })

  const isPending = grant.isPending || revoke.isPending

  function handleClick() {
    if (!canEdit || isPending) return
    if (acquis && staffCompetenceId !== null) revoke.mutate()
    else if (!acquis)                          grant.mutate()
  }

  // Couleurs : acquis = couleur de zone (fond + texte tintés), non-acquis = neutre.
  // Membre inactif → on force la version neutre, même pour les compétences acquises (cf. maquette staff-v4-etats).
  const acquiredStyle = acquis && !inactive
    ? {
        background:  `${zoneCouleur}1f`,                 // ~12% opacity
        borderColor: `${zoneCouleur}66`,                 // ~40%
        color:       zoneCouleur,
      }
    : {
        background:  'var(--surface)',
        borderColor: 'var(--border)',
        color:       'var(--muted)',
      }

  // Highlight pulsé 1.5s via Framer Motion (règle 12 du CLAUDE.md, pas de keyframes CSS).
  const highlightAnim = highlight
    ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 rgba(249,115,22,0)', '0 0 0 6px rgba(249,115,22,0.35)', '0 0 0 0 rgba(249,115,22,0)'] }
    : { scale: 1, boxShadow: '0 0 0 0 rgba(249,115,22,0)' }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={!canEdit || isPending}
      animate={highlightAnim}
      transition={highlight ? { duration: 1.5, repeat: 0, ease: 'easeOut' } : { duration: 0 }}
      className={[
        'skill-tag-button inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md',
        'text-[11px] font-semibold border transition-colors select-none',
        canEdit && !isPending ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
      ].join(' ')}
      style={{
        ...acquiredStyle,
        opacity: isPending ? 0.5 : 1,
      }}
      aria-pressed={acquis}
      title={canEdit ? (acquis ? 'Retirer cette compétence' : 'Attribuer cette compétence') : nom}
    >
      {acquis && <span aria-hidden>✓</span>}
      {nom}
    </motion.button>
  )
}
