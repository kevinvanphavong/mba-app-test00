'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Props {
  /** Chemin relatif côté API, ex: '/completions/42/photo'. Pas le baseURL. */
  src:        string
  alt:        string
  className?: string
  onClick?:   () => void
  /** Affiché pendant le chargement (placeholder simple). */
  fallback?:  React.ReactNode
}

/**
 * <img> qui passe par axios pour récupérer un binaire protégé par JWT.
 *
 * Pourquoi : un `<img src="/api/completions/42/photo">` natif ne peut pas
 * envoyer le header Authorization (limite navigateur). On contourne en
 * fetchant le binaire via le client axios (qui ajoute le JWT), puis on
 * crée un objectURL local qu'on pose dans <img>. URL.revokeObjectURL au
 * démontage pour ne pas leaker.
 */
export default function AuthImage({ src, alt, className, onClick, fallback }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error,     setError]     = useState(false)

  useEffect(() => {
    let active = true
    let createdUrl: string | null = null
    setError(false)

    api.get(src, { responseType: 'blob' })
      .then((r) => {
        if (!active) return
        createdUrl = URL.createObjectURL(r.data as Blob)
        setObjectUrl(createdUrl)
      })
      .catch(() => {
        if (active) setError(true)
      })

    return () => {
      active = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [src])

  if (error) {
    return (
      <div className={className} title="Image indisponible">
        <span className="text-[10px] text-[var(--muted)]">⚠</span>
      </div>
    )
  }

  if (!objectUrl) {
    return <div className={className}>{fallback}</div>
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  )
}
