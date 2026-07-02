'use client'

import { useExportCentre } from '@/hooks/useSuperAdminCentres'

/**
 * Bouton « Exporter toutes les données » (RGPD) d'un centre. Télécharge une archive
 * ZIP authentifiée (super-admin) ; l'action est tracée dans l'AuditLog côté serveur.
 */
export default function ExportCentreButton({ centreId }: { centreId: number }) {
  const exporter = useExportCentre()

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => exporter.mutate(centreId)}
        disabled={exporter.isPending}
        className="rounded-pill border border-border px-4 py-2 text-sm text-text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
      >
        {exporter.isPending ? 'Export en cours…' : '⬇️ Exporter toutes les données (RGPD)'}
      </button>
      {exporter.isError && <p className="text-xs text-red">Export impossible, réessaie.</p>}
      {exporter.isSuccess && <p className="text-xs text-green">Archive téléchargée.</p>}
    </div>
  )
}
