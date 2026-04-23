'use client'

import type { SupportAttachment } from '@/types/support'

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function AttachmentList({ attachments }: { attachments: SupportAttachment[] }) {
  if (attachments.length === 0) return null

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? ''

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map(a => {
        const isImage = a.mimeType.startsWith('image/')
        const fullUrl = apiBase + a.url

        if (isImage) {
          return (
            <a key={a.id} href={fullUrl} target="_blank" rel="noreferrer" className="block group">
              <img
                src={fullUrl}
                alt={a.filename}
                className="w-24 h-24 object-cover rounded-lg border border-border group-hover:border-accent transition"
              />
              <div className="text-[10px] text-muted mt-1 truncate max-w-[96px]">{a.filename}</div>
            </a>
          )
        }

        return (
          <a
            key={a.id}
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-surface2 border border-border rounded-lg py-2 px-3 text-[12px] hover:border-accent hover:text-accent transition"
          >
            <span>📄</span>
            <span className="max-w-[160px] truncate">{a.filename}</span>
            <span className="text-[10px] text-muted">{humanSize(a.size)}</span>
          </a>
        )
      })}
    </div>
  )
}
