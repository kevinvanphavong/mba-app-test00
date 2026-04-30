'use client'

/**
 * Page Validation Hebdomadaire — /pointage/validation
 * Vue manager pour relire, contrôler et valider les heures semaine par semaine.
 */

import { useState } from 'react'
import { startOfWeek, format } from 'date-fns'
import { useManagerGuard }  from '@/hooks/useManagerGuard'
import {
  useValidationSemaine,
  useValidationAlertes,
  useValidationDetail,
  useValiderEmploye,
  useValiderSemaine,
  useDevaliderSemaine,
  useCorrigerPointage,
} from '@/hooks/useValidation'
import { AnimatePresence, motion }  from 'framer-motion'
import Topbar                       from '@/components/layout/Topbar'
import ValidationWeekControl        from '@/components/validation/ValidationWeekControl'
import ValidationKPIs               from '@/components/validation/ValidationKPIs'
import ValidationTable              from '@/components/validation/ValidationTable'
import ValidationEmployeeDetail     from '@/components/validation/ValidationEmployeeDetail'
import ValidationWeekSummary        from '@/components/validation/ValidationWeekSummary'
import ValidationLegalAlerts        from '@/components/validation/ValidationLegalAlerts'
import type { CorrectionPayload }   from '@/types/validation'

function getLundiISO(date: Date): string {
  const lundi = startOfWeek(date, { weekStartsOn: 1 })
  return format(lundi, 'yyyy-MM-dd')
}

export default function ValidationPage() {
  useManagerGuard()

  // Semaine courante (lundi)
  const [currentLundi, setCurrentLundi] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const dateStr = getLundiISO(currentLundi)

  // Données semaine
  const { data: semaine, isLoading, isError } = useValidationSemaine(dateStr)
  const { data: alertes } = useValidationAlertes(dateStr)
  const { data: detailEmploye } = useValidationDetail(selectedUserId, dateStr)

  // Mutations
  const validerEmployeMut   = useValiderEmploye(dateStr)
  const validerSemaineMut   = useValiderSemaine(dateStr)
  const devaliderSemaineMut = useDevaliderSemaine(dateStr)
  const corrigerMut         = useCorrigerPointage(dateStr)

  // Statistiques validation pour le badge
  const nbValides = semaine
    ? semaine.employes.filter(e => e.statut === 'VALIDEE').length
    : 0
  const nbTotal = semaine?.employes.length ?? 0

  const handleValiderEmploye = (userId: number) => {
    validerEmployeMut.mutate(userId)
  }

  const handleCorriger = (payload: CorrectionPayload) => {
    corrigerMut.mutate(payload)
  }

  const handleValiderTout = () => {
    validerSemaineMut.mutate()
  }

  const handleDevaliderTout = () => {
    if (nbValides === 0) return
    if (!confirm(`Dévalider les ${nbValides} validation(s) de cette semaine ?`)) return
    devaliderSemaineMut.mutate()
  }

  // ─── États de la page ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-screen" style={{ background: 'var(--bg)' }}>
        <Topbar />
        <div className="flex items-center justify-center flex-1">
          <div className="text-sm" style={{ color: 'var(--muted)' }}>Chargement des données...</div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col flex-1 min-h-screen" style={{ background: 'var(--bg)' }}>
        <Topbar />
        <div className="flex items-center justify-center flex-1">
          <div className="text-sm" style={{ color: 'var(--red)' }}>Erreur lors du chargement des données.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen" style={{ background: 'var(--bg)' }}>
      <Topbar />

      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">

        {/* En-tête avec boutons d'action */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div
            className="font-syne font-extrabold text-[22px]"
            style={{ color: 'var(--text)' }}
          >
            Pointage — <span style={{ color: 'var(--accent)' }}>Validation hebdomadaire</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleDevaliderTout}
              disabled={devaliderSemaineMut.isPending || nbValides === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: 'transparent',
                color: 'var(--red)',
                borderColor: 'var(--red)',
                opacity: devaliderSemaineMut.isPending || nbValides === 0 ? 0.4 : 1,
                cursor: devaliderSemaineMut.isPending || nbValides === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ✕ {devaliderSemaineMut.isPending ? 'Dévalidation...' : 'Tout dévalider'}
            </button>

            <button
              onClick={handleValiderTout}
              disabled={validerSemaineMut.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white',
                opacity: validerSemaineMut.isPending ? 0.7 : 1,
              }}
            >
              ✓ {validerSemaineMut.isPending ? 'Validation...' : 'Tout valider'}
            </button>
          </div>
        </div>

        {/* Navigation semaine */}
        <div className="mb-5">
          <ValidationWeekControl
            currentLundi={currentLundi}
            onChange={setCurrentLundi}
            statut={semaine?.statutSemaine}
            nbValides={nbValides}
            nbTotal={nbTotal}
          />
        </div>

        {/* KPIs */}
        {semaine && (
          <div className="mb-5">
            <ValidationKPIs kpis={semaine.kpis} />
          </div>
        )}

        {/* Tableau principal */}
        <div
          className="mb-5 rounded-[14px] overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {semaine ? (
            <ValidationTable
              employes={semaine.employes}
              selectedUserId={selectedUserId}
              onSelectEmploye={(id) => setSelectedUserId(prev => prev === id ? null : id)}
              dateDebut={semaine.dateDebut}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
              <div className="text-3xl mb-3">📋</div>
              <div className="text-sm">Aucune donnée pour cette semaine</div>
            </div>
          )}
        </div>

        {/* Modal mobile — détail employé */}
        <AnimatePresence>
          {selectedUserId && detailEmploye && (
            <motion.div
              className="validation-mobile-modal lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="validation-mobile-modal-backdrop"
                onClick={() => setSelectedUserId(null)}
              />
              <motion.div
                className="validation-mobile-modal-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <div className="validation-mobile-modal-handle" />
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="text-[15px] font-bold flex items-center gap-2">
                    👤 {detailEmploye.prenom} {detailEmploye.nom}
                  </div>
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="text-xl w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--muted)', background: 'var(--surface2)' }}
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1">
                  <ValidationEmployeeDetail
                    employe={detailEmploye}
                    onValider={handleValiderEmploye}
                    onCorriger={handleCorriger}
                    isValidating={validerEmployeMut.isPending}
                    isCorrecting={corrigerMut.isPending}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section basse : Détail + Résumé + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Panneau détail employé — desktop uniquement */}
          <div
            className="hidden lg:block rounded-[14px] overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-[15px] font-bold flex items-center gap-2">
                👤 {detailEmploye
                  ? `Détail — ${detailEmploye.prenom} ${detailEmploye.nom}`
                  : 'Cliquez sur un employé'}
              </div>
            </div>
            <div className="p-5">
              {detailEmploye ? (
                <ValidationEmployeeDetail
                  employe={detailEmploye}
                  onValider={handleValiderEmploye}
                  onCorriger={handleCorriger}
                  isValidating={validerEmployeMut.isPending}
                  isCorrecting={corrigerMut.isPending}
                />
              ) : (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
                  Sélectionnez un employé dans le tableau pour voir le détail de sa semaine.
                </div>
              )}
            </div>
          </div>

          {/* Résumé + Alertes — pleine largeur mobile, colonne droite desktop */}
          <div className="lg:col-start-2 flex flex-col gap-5">

            {/* Résumé semaine */}
            <div
              className="rounded-[14px] overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-[15px] font-bold">📊 Résumé semaine</div>
              </div>
              <div className="p-5">
                {semaine ? (
                  <ValidationWeekSummary employes={semaine.employes} />
                ) : (
                  <div className="py-4 text-sm text-center" style={{ color: 'var(--muted)' }}>—</div>
                )}
              </div>
            </div>

            {/* Alertes légales */}
            <div
              className="rounded-[14px] overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-[15px] font-bold">⚠️ Alertes légales</div>
              </div>
              <div className="p-5">
                <ValidationLegalAlerts alertes={alertes ?? []} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
