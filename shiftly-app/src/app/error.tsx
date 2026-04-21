'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="text-center">
        <div className="font-syne font-extrabold text-[28px] text-accent mb-2">Oops</div>
        <p className="text-muted text-[13px] mb-6">Une erreur inattendue s'est produite.</p>
        <button
          onClick={reset}
          className="bg-accent text-white font-bold text-[13px] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
