'use client'

import { useSupportAttachmentUrl } from '@/hooks/useSupport'
import type { SupportAttachment } from '@/types/support'

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function AttachmentList({ attachments }: { attachments: SupportAttachment[] }) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map(a => (
        <AttachmentTile key={a.id} attachment={a} />
      ))}
    </div>
  )
}

/** Vignette d'un attachment — fetch lazy de l'URL signée R2. */
function AttachmentTile({ attachment: a }: { attachment: SupportAttachment }) {
  const { data, isLoading, isError } = useSupportAttachmentUrl(a.id)

  const isImage = a.mimeType.startsWith('image/')

  if (isLoading) {
    return (
      <div className="w-24 h-24 rounded-lg border border-border bg-surface2 flex items-center justify-center text-[10px] text-muted">
        …
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="w-24 h-24 rounded-lg border border-border bg-surface2 flex items-center justify-center text-[10px] text-red">
        erreur
      </div>
    )
  }

  if (isImage) {
    return (
      <a href={data.url} target="_blank" rel="noreferrer" className="block group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.url}
          alt={a.filename}
          className="w-24 h-24 object-cover rounded-lg border border-border group-hover:border-accent transition"
        />
        <div className="text-[10px] text-muted mt-1 truncate max-w-[96px]">{a.filename}</div>
      </a>
    )
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 bg-surface2 border border-border rounded-lg py-2 px-3 text-[12px] hover:border-accent hover:text-accent transition"
    >
      <span>📄</span>
      <span className="max-w-[160px] truncate">{a.filename}</span>
      <span className="text-[10px] text-muted">{humanSize(a.size)}</span>
    </a>
  )
}
