import StatCard from '@/components/ui/StatCard'
import type { DashboardData } from '@/types/dashboard'

interface KPIGridProps {
  data: Pick<DashboardData, 'service' | 'staff' | 'incidents' | 'tutoriels' | 'stats'>
}

/**
 * Grille des 6 KPI principaux :
 *  1. Moyenne completion de tous les services
 *  2. Employés actifs dans le service du jour
 *  3. Incidents ouverts
 *  4. Taux lecture tutoriels
 *  5. Cumul points staff actif
 *  6. Total missions du service du jour
 */
export default function KPIGrid({ data }: KPIGridProps) {
  const { service, incidents, tutoriels, stats } = data

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {/* 1 — Moyenne completion tous services */}
      <StatCard
        icon="📊"
        value={`${stats.moyenneCompletion.toFixed(0)}%`}
        label="Moy. complétion services"
      />

      {/* 2 — Staff actif dans le service du jour */}
      <StatCard
        icon="👥"
        value={service.staffActifCount}
        label="Employés actifs"
      />

      {/* 3 — Incidents ouverts */}
      <StatCard
        icon="⚠️"
        value={incidents.total}
        label="Incidents ouverts"
        trend={
          incidents.haute > 0
            ? { value: `${incidents.haute} haute`, up: false }
            : undefined
        }
      />

      {/* 4 — Taux lecture tutoriels */}
      <StatCard
        icon="📖"
        value={`${tutoriels.tauxLecture.toFixed(0)}%`}
        label="Taux lecture tutos"
      />

      {/* 5 — Cumul points staff actif */}
      <StatCard
        icon="⭐"
        value={service.pointsStaffActif}
        label="Points staff actif"
      />

      {/* 6 — Total missions du service du jour */}
      <StatCard
        icon="✅"
        value={service.totalMissions}
        label="Missions du service"
      />
    </div>
  )
}
