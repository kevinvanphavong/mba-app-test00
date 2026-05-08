'use client'

import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useUploadMedia, useDeleteMedia, useMediaUrl } from '@/hooks/useMedias'
import { useToastStore } from '@/store/toastStore'
import type { EditorTutoriel, TutorielFormData, TutoBlockForm } from '@/types/editeur'
import type { EditorZone }                     from '@/types/editeur'

interface Props {
  open:          boolean
  editTutoriel:  EditorTutoriel | null
  zones:         EditorZone[]
  onClose:       () => void
  onSave:        (data: TutorielFormData) => void
}

const NIVEAUX = [
  { value: 'debutant'      as const, label: 'Débutant'      },
  { value: 'intermediaire' as const, label: 'Intermédiaire' },
  { value: 'avance'        as const, label: 'Avancé'        },
]

export default function ModalAddTutoriel({ open, editTutoriel, zones, onClose, onSave }: Props) {
  const [titre,   setTitre]   = useState('')
  const [niveau,  setNiveau]  = useState<TutorielFormData['niveau']>('debutant')
  const [dureMin, setDureMin] = useState<string>('')
  const [zoneId,  setZoneId]  = useState<number | null>(null)
  const [blocs,   setBlocs]   = useState<TutoBlockForm[]>([])

  useEffect(() => {
    if (!open) return
    if (editTutoriel) {
      setTitre(editTutoriel.titre)
      setNiveau(editTutoriel.niveau)
      setDureMin(editTutoriel.dureMin?.toString() ?? '')
      setZoneId(editTutoriel.zoneId)
      setBlocs((editTutoriel.contenu ?? []) as TutoBlockForm[])
    } else {
      setTitre(''); setNiveau('debutant'); setDureMin(''); setZoneId(null); setBlocs([])
    }
  }, [open, editTutoriel])

  function addBloc(type: TutoBlockForm['type']) {
    if (type === 'step') {
      const num = blocs.filter(b => b.type === 'step').length + 1
      setBlocs(prev => [...prev, { type: 'step', number: num, title: '', text: '' }])
    } else {
      setBlocs(prev => [...prev, { type, text: '' } as TutoBlockForm])
    }
  }

  function updateBloc(i: number, patch: Partial<TutoBlockForm>) {
    setBlocs(prev => prev.map((b, idx) => idx === i ? { ...b, ...patch } as TutoBlockForm : b))
  }

  function removeBloc(i: number) {
    setBlocs(prev => prev.filter((_, idx) => idx !== i).map((b, idx) =>
      b.type === 'step' ? { ...b, number: blocs.filter((x, xi) => x.type === 'step' && xi < idx).length + 1 } : b
    ))
  }

  function handleSubmit() {
    if (!titre.trim()) return
    onSave({ titre: titre.trim(), niveau, dureMin: dureMin ? parseInt(dureMin) : null, zoneId, contenu: blocs })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-[24px] px-5 pt-5 pb-20 max-h-[90vh] overflow-y-auto flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <h3 className="font-syne font-extrabold text-[16px] text-text">
            {editTutoriel ? 'Modifier le tutoriel' : 'Nouveau tutoriel'}
          </h3>
          <button onClick={onClose} className="text-muted text-[20px] leading-none">×</button>
        </div>

        {/* Titre */}
        <input
          value={titre} onChange={e => setTitre(e.target.value)}
          placeholder="Titre du tutoriel"
          className="w-full px-3 py-2.5 bg-surface2 border border-border rounded-[10px] text-[13px] text-text placeholder:text-muted outline-none focus:border-accent/50"
        />

        {/* Zone + Niveau + Durée */}
        <div className="flex gap-2">
          <select
            value={zoneId ?? ''}
            onChange={e => setZoneId(e.target.value ? parseInt(e.target.value) : null)}
            className="flex-1 px-3 py-2.5 bg-surface2 border border-border rounded-[10px] text-[12px] text-text outline-none"
          >
            <option value="">Aucune zone</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
          </select>
          <input
            type="number" min={1} value={dureMin} onChange={e => setDureMin(e.target.value)}
            placeholder="min"
            className="w-16 px-2 py-2.5 bg-surface2 border border-border rounded-[10px] text-[12px] text-text text-center outline-none"
          />
        </div>

        {/* Niveau */}
        <div className="flex gap-2">
          {NIVEAUX.map(n => (
            <button
              key={n.value}
              onClick={() => setNiveau(n.value)}
              className={`flex-1 py-2 rounded-[10px] text-[11px] font-bold border transition-all ${
                niveau === n.value ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Builder de blocs */}
        <div>
          <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-muted mb-2">Contenu</p>
          <div className="flex flex-col gap-2 mb-3">
            {blocs.map((bloc, i) => (
              <BlocCard
                key={i}
                bloc={bloc}
                tutorielId={editTutoriel?.id ?? null}
                onUpdate={(patch) => updateBloc(i, patch)}
                onRemove={() => removeBloc(i)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {(['intro', 'step', 'tip'] as const).map(type => (
              <button key={type} onClick={() => addBloc(type)}
                className="flex-1 py-1.5 rounded-[8px] border border-border text-[11px] text-muted hover:border-accent/40 hover:text-accent transition-all">
                + {type === 'intro' ? 'Intro' : type === 'step' ? 'Étape' : 'Astuce'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!titre.trim()}
          className="w-full py-3 rounded-[12px] bg-accent text-white font-syne font-bold text-[14px] disabled:opacity-40 transition-opacity"
        >
          {editTutoriel ? 'Enregistrer' : 'Créer le tutoriel'}
        </button>
      </div>
    </div>
  )
}

// ─── Carte d'un bloc + uploader inline ────────────────────────────────────────

interface BlocCardProps {
  bloc:        TutoBlockForm
  /** ID du tutoriel parent — null = pas encore persisté, on cache l'uploader */
  tutorielId:  number | null
  onUpdate:    (patch: Partial<TutoBlockForm>) => void
  onRemove:    () => void
}

function BlocCard({ bloc, tutorielId, onUpdate, onRemove }: BlocCardProps) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const upload      = useUploadMedia()
  const deleteMedia = useDeleteMedia()
  const showToast   = useToastStore(s => s.show)

  const mediaIds = bloc.mediaIds ?? []

  const onPickFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!tutorielId || !e.target.files) return
    const files = Array.from(e.target.files)
    const newIds: number[] = []
    for (const file of files) {
      try {
        const m = await upload.mutateAsync({ file, entityType: 'tutoriel', entityId: tutorielId })
        newIds.push(m.id)
      } catch {
        showToast('Échec upload', 'error')
      }
    }
    if (newIds.length > 0) {
      onUpdate({ mediaIds: [...mediaIds, ...newIds] } as Partial<TutoBlockForm>)
      showToast(`${newIds.length} fichier${newIds.length > 1 ? 's' : ''} ajouté${newIds.length > 1 ? 's' : ''}`, 'success')
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const onRemoveMedia = async (mediaId: number) => {
    if (!tutorielId) return
    try {
      await deleteMedia.mutateAsync({ mediaId, entityType: 'tutoriel', entityId: tutorielId })
      onUpdate({ mediaIds: mediaIds.filter(id => id !== mediaId) } as Partial<TutoBlockForm>)
    } catch {
      showToast('Échec suppression', 'error')
    }
  }

  const label =
    bloc.type === 'intro' ? '📝 Intro'
    : bloc.type === 'step' ? `⚙️ Étape ${(bloc as { number: number }).number}`
    : '💡 Astuce'

  return (
    <div className="bg-surface2 border border-border rounded-[10px] p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-muted uppercase">{label}</span>
        <button onClick={onRemove} className="text-muted hover:text-red text-[13px]">×</button>
      </div>

      {bloc.type === 'step' && (
        <input
          value={(bloc as { title: string }).title}
          onChange={e => onUpdate({ title: e.target.value } as Partial<TutoBlockForm>)}
          placeholder="Titre de l'étape"
          className="w-full px-2 py-1.5 bg-surface border border-border rounded-[8px] text-[12px] text-text outline-none"
        />
      )}

      <textarea
        value={bloc.text}
        onChange={e => onUpdate({ text: e.target.value })}
        placeholder="Texte…"
        rows={2}
        className="w-full px-2 py-1.5 bg-surface border border-border rounded-[8px] text-[12px] text-text resize-none outline-none"
      />

      {/* Vignettes des médias attachés à ce bloc */}
      {mediaIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {mediaIds.map(id => (
            <BlocMediaThumb key={id} mediaId={id} onRemove={() => onRemoveMedia(id)} />
          ))}
        </div>
      )}

      {/* Bouton upload — masqué si tutoriel pas encore persisté */}
      {tutorielId && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="self-start mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-border text-[10px] text-muted hover:border-accent/40 hover:text-accent transition-all disabled:opacity-40"
          >
            {upload.isPending ? '⏳ upload…' : '📷 Photo'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Vignette d'un média dans le builder ──────────────────────────────────────

function BlocMediaThumb({ mediaId, onRemove }: { mediaId: number; onRemove: () => void }) {
  const { data, isLoading, isError } = useMediaUrl(mediaId)

  return (
    <div className="relative group w-14 h-14 rounded-md overflow-hidden border border-border bg-surface">
      {isLoading && <div className="w-full h-full" />}
      {isError && (
        <div className="w-full h-full flex items-center justify-center text-[8px] text-red">erreur</div>
      )}
      {data && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.url} alt="" className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Retirer"
        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-surface/90 border border-border text-red text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  )
}
