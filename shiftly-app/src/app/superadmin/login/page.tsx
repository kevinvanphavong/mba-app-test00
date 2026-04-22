'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSuperAdminLogin } from '@/hooks/useSuperAdminAuth'
import { fadeUpVariants as fadeUp } from '@/lib/animations'

export default function SuperAdminLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const login = useSuperAdminLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 40,
          width: '100%',
          maxWidth: 380,
        }}
      >
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
            Shiftly
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Accès SuperAdmin</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>

          {login.isError && (
            <p style={{ fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>
              Identifiants incorrects
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, marginTop: 8,
              opacity: login.isPending ? 0.7 : 1,
            }}
          >
            {login.isPending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
