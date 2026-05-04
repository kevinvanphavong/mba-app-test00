import StatCard from '@/components/ui/StatCard'
import type { DashboardData } from '@/types/dashboard'

interface KPIGridProps {
  data: Pick<DashboardData, 'service' | 'staff' | 'incidents' | 'tutoriels' | 'stats'>
}

/**
 * Grille des 4 KPI principaux (V2) :
 *  1. Tâches du jour       — completed/total · tag « En cours »
 *  2. Staff actifs         — count           · tag « +N ce mois »
 *  3. Incidents ouverts    — count           · tag « À traiter »
 *  4. Tutos lus équipe     — % lecture       · tag « Moy. équipe »
 */
export default function KPIGrid({ data }: KPIGridProps) {
  const { service, staff, incidents, tutoriels } = data

  // Calcul tâches : on a tauxCompletion (%) et totalMissions sur service du jour.
  // Pour l'affichage type "5/18", on dérive completed = round(taux * total / 100).
  const totalTaches     = service.totalMissions
  const completedTaches = totalTaches > 0
    ? Math.round((service.tauxCompletion / 100) * totalTaches)
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1 — Tâches du jour */}
      <StatCard
        icon="✅"
        value={`${completedTaches}/${totalTaches}`}
        label="Tâches du jour"
        tag="En cours"
      />

      {/* 2 — Staff actifs */}
      <StatCard
        icon="👥"
        value={service.staffActifCount}
        label="Staff actifs"
        tag={staff.nouveauxCeMois > 0 ? `+${staff.nouveauxCeMois} ce mois` : undefined}
      />

      {/* 3 — Incidents ouverts */}
      <StatCard
        icon="⚠️"
        value={incidents.total}
        label="Incidents ouverts"
        tag="À traiter"
      />

      {/* 4 — Tutos lus équipe */}
      <StatCard
        icon="📖"
        value={`${tutoriels.tauxLecture.toFixed(0)}%`}
        label="Tutos lus équipe"
        tag="Moy. équipe"
      />
    </div>
  )
}
