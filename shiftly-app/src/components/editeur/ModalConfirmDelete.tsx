'use client'

interface Props {
  open:        boolean
  type:        'zone' | 'mission' | 'competence' | 'tutoriel'
  nom:         string
  missionCount?: number
  competenceCount?: number
  onClose:     () => void
  onConfirm:   () => void
}

const TYPE_LABEL = {
  zone:        'zone',
  mission:     'mission',
  competence:  'compétence',
  tutoriel:    'tutoriel',
}

export default function ModalConfirmDelete({
  open,
  type,
  nom,
  missionCount = 0,
  competenceCount = 0,
  onClose,
  onConfirm,
}: Props) {
  function handleConfirm() {
    onConfirm()
  }

  if (!open) return null

  const isZone = type === 'zone'

  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface border border-border rounded-t-[24px] px-4 pt-5 pb-8 animate-fadeUp max-w-[390px] mx-auto">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-[18px]" />

        <h2 className="font-syne font-extrabold text-[18px] mb-1">
          Archiver &ldquo;{nom}&rdquo;&nbsp;?
        </h2>
        <p className="text-[12px] text-muted mb-[14px]">Cette action est réversible</p>

        {/* Warning box rouge */}
        <div className="flex gap-[10px] bg-red/8 border border-red/20 rounded-[12px] px-3 py-3 mb-[14px]">
          <span className="text-[20px] flex-shrink-0">⚠️</span>
          <p className="text-[12px] text-text leading-[1.5]">
            {isZone
              ? `La ${TYPE_LABEL[type]} et son contenu (${missionCount} missions, ${competenceCount} compétences) seront masqués dans toute l'app. Ils resteront accessibles depuis l'éditeur.`
              : `Cette ${TYPE_LABEL[type]} sera masquée dans toute l'app. Elle restera accessible depuis l'éditeur.`}
          </p>
        </div>

        {/* Conséquences */}
        {isZone && (
          <div className="mb-[14px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-muted mb-2">Conséquences</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <span>🙈</span> Invisible dans Service du Jour
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <span>🙈</span> Invisible dans les Postes
              </div>
              <div className="flex items-center gap-2 text-[12px] text-green">
                <span>✅</span> Historique conservé
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-[14px]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] border border-border bg-transparent text-muted text-[13px] font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-3 rounded-[12px] bg-red border-none text-white font-syne font-extrabold text-[13px]"
          >
            Archiver
          </button>
        </div>
      </div>
    </>
  )
}
