'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router  = useRouter()
  const setUser = useAuthStore(s => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Indispensable pour que le backend pose le cookie httpOnly.
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        }
      )

      if (res.status === 429) {
        setError('Trop de tentatives. Réessaie dans quelques minutes.')
        return
      }
      if (!res.ok) {
        setError('Email ou mot de passe incorrect.')
        return
      }

      // Le cookie httpOnly est déjà posé ; la réponse contient le profil user/centre.
      const user = await res.json()
      setUser(user)

      router.push('/service')
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-syne font-extrabold text-[28px]">
            <span className="text-accent">Shiftly</span>
            <span className="text-text">.</span>
          </div>
          <div className="text-[12px] text-muted mt-1">Management opérationnel</div>
        </div>

        {/* Form card */}
        <div className="bg-surface border border-border rounded-[20px] p-6">
          <h2 className="font-syne font-extrabold text-[18px] text-text mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wide block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="vous@shiftly.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted uppercase tracking-wide block mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface2 border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <div className="text-[12px] text-red font-medium">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-accent-light text-white font-bold text-[14px] py-3 rounded-xl mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <span className="text-[11px] text-muted">
          </span>
        </div>
      </div>
    </div>
  )
}
