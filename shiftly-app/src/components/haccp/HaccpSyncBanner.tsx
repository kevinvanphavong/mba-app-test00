'use client'

import { ty } from '@/lib/typography'
import type { HaccpSyncResult } from '@/types/haccp'

interface Props {
  onSync: () => void
  loading: boolean
  result?: HaccpSyncResult | null
}

/** Bandeau bouton "Régénérer les missions" + dernier rapport sync. */
export default function HaccpSyncBanner({ onSync, loading, result }: Props) {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-3 flex flex-col tablet:flex-row tablet:items-center tablet:justify-between gap-3">
      <div>
        <h3 className="font-syne font-extrabold text-[13px]">🔄 Synchronisation missions</h3>
        <p className={ty.metaSm}>
          Crée 2 missions T° par équipement actif. Idempotent : ré-exécution sans risque.
        </p>
        {result && (
          <p className={`${ty.metaSm} mt-1 text-text`}>
            Créées : <strong>{result.creees}</strong> · Archivées : <strong>{result.archivees}</strong> · Réactivées : <strong>{result.reactivees}</strong> · Inchangées : <strong>{result.inchangees}</strong>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className="py-2 px-4 rounded-[10px] bg-accent text-white text-[13px] font-semibold disabled:opacity-60 flex-shrink-0"
      >
        {loading ? 'Sync…' : 'Régénérer les missions'}
      </button>
    </div>
  )
}
