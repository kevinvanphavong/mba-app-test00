'use client'

import type { StaffMember } from '@/types/staff'

interface Props {
  members:          StaffMember[]
  onEdit:           (m: StaffMember) => void
  onToggleActif:    (m: StaffMember) => void
  onManageComps:    (m: StaffMember) => void
  onAdd:            () => void
}

export default function StaffEditorList({ members, onEdit, onToggleActif, onManageComps, onAdd }: Props) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <span className="text-4xl mb-3">👥</span>
        <p className="text-[14px] font-bold text-text mb-1">Aucun membre</p>
        <p className="text-[12px] text-muted mb-4">Ajoutez le premier membre de l'équipe.</p>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-[10px] bg-accent/10 border border-accent/30 text-accent text-[12px] font-semibold"
        >
          + Nouveau membre
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map(m => (
        <div
          key={m.id}
          className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-[12px] border border-border"
        >
          {/* Dot actif */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.actif ? 'bg-green' : 'bg-muted'}`} />

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text truncate">
              {m.prenom ? `${m.prenom} ${m.nom}` : m.nom}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted">{m.role === 'MANAGER' ? 'Manager' : 'Employé'}</span>
              <span className="text-[10px] text-muted">·</span>
              <span className="text-[10px] text-muted">{m.points} pts</span>
              {!m.actif && (
                <span className="text-[9px] font-bold text-muted bg-surface2 border border-border px-1.5 rounded-[4px]">
                  Inactif
                </span>
              )}
              {m.codePointage === '0000' && (
                <span
                  className="text-[9px] font-bold px-1.5 rounded-[4px] border"
                  style={{
                    color: 'var(--accent)',
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
                  }}
                  title="Code PIN par défaut, à personnaliser"
                >
                  PIN par défaut
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => onManageComps(m)}
            title="Gérer les compétences"
            className="text-[11px] text-muted hover:text-accent transition-colors px-1.5"
          >
            🏆
          </button>
          <button
            onClick={() => onToggleActif(m)}
            title={m.actif ? 'Désactiver' : 'Réactiver'}
            className={`text-[11px] px-1.5 transition-colors ${m.actif ? 'text-muted hover:text-red' : 'text-muted hover:text-green'}`}
          >
            {m.actif ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => onEdit(m)}
            className="text-[11px] text-muted hover:text-text transition-colors px-1.5"
          >
            ✏️
          </button>
        </div>
      ))}
    </div>
  )
}
