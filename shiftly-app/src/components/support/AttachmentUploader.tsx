'use client'

import { useRef } from 'react'
import { useToastStore } from '@/store/toastStore'

const MAX_SIZE    = 5 * 1024 * 1024
const ALLOWED     = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

interface Props {
  files:     File[]
  onChange:  (files: File[]) => void
  disabled?: boolean
}

export default function AttachmentUploader({ files, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const toast    = useToastStore(s => s.show)

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    const valid: File[] = []

    for (const f of picked) {
      if (f.size > MAX_SIZE) {
        toast(`${f.name} dépasse 5 Mo`, 'error')
        continue
      }
      if (!ALLOWED.includes(f.type)) {
        toast(`${f.name} : type non autorisé (images ou PDF uniquement)`, 'error')
        continue
      }
      valid.push(f)
    }

    onChange([...files, ...valid])
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeAt = (idx: number) => onChange(files.filter((_, i) => i !== idx))

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        onChange={handleSelect}
        disabled={disabled}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface2 text-text text-[12px] hover:border-accent hover:text-accent transition disabled:opacity-50"
      >
        📎 Joindre un fichier
      </button>

      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <span className="truncate max-w-[200px]">{f.name}</span>
              <span className="text-[10px] text-muted">{(f.size / 1024).toFixed(0)} Ko</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-red text-[11px] hover:underline"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
