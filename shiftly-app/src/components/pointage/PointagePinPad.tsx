'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import type { PointageEntry } from '@/types/pointage'

interface Props {
  pointage:     PointageEntry
  action:       'arrivee' | 'depart' | 'pause_start' | 'pause_end'
  onValidate:   (pin: string | null, managerBypass: boolean) => void
  onCancel:     () => void
  isLoading?:   boolean
  errorMessage?: string | null
}

const TOUCHES = ['1','2','3','4','5','6','7','8','9','','0','⌫']

const LABEL_ACTION: Record<string, string> = {
  arrivee:     'Pointer l\'arrivée',
  depart:      'Pointer le départ',
  pause_start: 'Démarrer une pause',
  pause_end:   'Reprendre le service',
}

function Avatar({ user }: { user: PointageEntry['user'] }) {
  const initiales = [user.prenom?.[0], user.nom[0]].filter(Boolean).join('').toUpperCase()
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
      style={{ background: user.avatarColor ?? 'var(--surface2)', color: '#fff', fontFamily: 'var(--font-syne)' }}
    >
      {initiales}
    </div>
  )
}

export default function PointagePinPad({
  pointage, action, onValidate, onCancel, isLoading, errorMessage,
}: Props) {
  const [pin,         setPin]         = useState('')
  const [shake,       setShake]       = useState(false)
  const [tentatives,  setTentatives]  = useState(0)
  const [verrou,      setVerrou]      = useState(0)   // timestamp de fin de verrouillage
  const [countdown,   setCountdown]   = useState(0)

  const aCodePin = pointage.user.role === 'EMPLOYE'
    ? true  // on ne peut pas savoir côté front si le code est null — l'API nous dira

    : false

  // Countdown de verrouillage
  useEffect(() => {
    if (!verrou) return
    const id = setInterval(() => {
      const restant = Math.ceil((verrou - Date.now()) / 1000)
      if (restant <= 0) { setVerrou(0); setCountdown(0); setTentatives(0) }
      else setCountdown(restant)
    }, 500)
    return () => clearInterval(id)
  }, [verrou])

  // Déclenche le shake + comptage des tentatives sur erreur API
  useEffect(() => {
    if (!errorMessage) return
    setShake(true)
    setPin('')
    const newTentatives = tentatives + 1
    setTentatives(newTentatives)
    if (newTentatives >= 3) {
      setVerrou(Date.now() + 30_000)
    }
    setTimeout(() => setShake(false), 450)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorMessage])

  const appuyerTouche = useCallback((t: string) => {
    if (verrou || isLoading) return
    if (t === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (t === '')   return
    if (pin.length >= 4) return

    const nouveau = pin + t
    setPin(nouveau)

    if (nouveau.length === 4) {
      setTimeout(() => onValidate(nouveau, false), 80)
    }
  }, [pin, verrou, isLoading, onValidate])

  const user = pointage.user
  const nom  = user.prenom ? `${user.prenom} ${user.nom}` : user.nom

  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      animate="show"
      className="pinpad flex flex-col items-center gap-6 p-6 w-full max-w-sm mx-auto"
    >
      {/* En-tête employé */}
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar user={user} />
        <div>
          <p className="font-bold text-base font-syne text-[var(--text)]">{nom}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{LABEL_ACTION[action]}</p>
        </div>
      </div>

      {/* 4 cercles indicateurs */}
      <motion.div
        className={`flex gap-3 ${shake ? 'pinpad-shake' : ''}`}
        animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`pinpad-dot ${
              i < pin.length
                ? errorMessage ? 'error' : 'filled'
                : ''
            }`}
          />
        ))}
      </motion.div>

      {/* Message d'erreur ou verrouillage */}
      <AnimatePresence mode="wait">
        {verrou ? (
          <motion.p
            key="verrou"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs font-semibold text-center"
            style={{ color: 'var(--red)' }}
          >
            Verrouillé — réessayez dans {countdown}s
          </motion.p>
        ) : errorMessage ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs font-semibold text-center"
            style={{ color: 'var(--red)' }}
          >
            {errorMessage}
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-xs text-center"
            style={{ color: 'var(--muted)' }}
          >
            Saisissez votre code à 4 chiffres
          </motion.p>
        )}
      </AnimatePresence>

      {/* Clavier 3×4 */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {TOUCHES.map((t, i) => (
          <button
            key={i}
            onClick={() => appuyerTouche(t)}
            disabled={!t || !!verrou || isLoading}
            className={`pinpad-key flex items-center justify-center ${t === '⌫' ? 'delete' : ''} ${!t ? 'invisible' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Annuler */}
      <button
        onClick={onCancel}
        className="text-xs font-semibold w-full py-2 rounded-lg"
        style={{ color: 'var(--text)', background: 'var(--surface2)' }}
      >
        Annuler
      </button>
    </motion.div>
  )
}
