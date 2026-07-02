'use client'

import { useState } from 'react'
import { useCreerClient } from '@/hooks/useConsoleAgence'

const errMessage = (e: unknown): string => {
  const err = e as { response?: { status?: number; data?: { message?: string } } }
  if (err?.response?.status === 409) return err.response.data?.message ?? 'Domaine ou email déjà utilisé.'
  if (err?.response?.status === 422) return 'Vérifie les champs (email valide, mot de passe ≥ 8, abonnement ≥ 0).'
  return 'Création impossible, réessaie.'
}

/** Formulaire d'onboarding d'un nouveau client (super-admin). Le back valide + isole. */
export default function NouveauClientModal({ onClose }: { onClose: () => void }) {
  const [nom, setNom] = useState('')
  const [domaine, setDomaine] = useState('')
  const [managerNom, setManagerNom] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
  const [managerMotDePasse, setPw] = useState('')
  const [abonnementEuros, setAbo] = useState('')
  const creer = useCreerClient()

  const submit = () => {
    creer.mutate(
      {
        nom: nom.trim(),
        domaine: domaine.trim(),
        managerNom: managerNom.trim(),
        managerEmail: managerEmail.trim(),
        managerMotDePasse,
        abonnementMensuelCents: Math.max(0, Math.round((parseFloat(abonnementEuros.replace(',', '.')) || 0) * 100)),
      },
      { onSuccess: onClose },
    )
  }

  const prete = nom.trim() && domaine.trim() && managerNom.trim() && managerEmail.trim() && managerMotDePasse.length >= 8

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-syne text-lg font-bold text-text">Nouveau client</h2>

        <div className="flex flex-col gap-3">
          <Field label="Nom du centre" value={nom} onChange={setNom} placeholder="VR Galaxie Nantes" />
          <Field label="Domaine" value={domaine} onChange={setDomaine} placeholder="vr-galaxie-nantes.fr" />
          <Field label="Nom du gérant" value={managerNom} onChange={setManagerNom} placeholder="Léa Martin" />
          <Field label="Email du gérant" value={managerEmail} onChange={setManagerEmail} placeholder="gerant@client.fr" type="email" />
          <Field label="Mot de passe initial" value={managerMotDePasse} onChange={setPw} placeholder="8 caractères min." type="password" />
          <Field label="Abonnement mensuel (€)" value={abonnementEuros} onChange={setAbo} placeholder="299" type="number" />
        </div>

        {creer.isError && <p className="mt-3 text-sm text-red">{errMessage(creer.error)}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-pill border border-border px-4 py-2 text-sm text-text-soft hover:border-accent">
            Annuler
          </button>
          <button onClick={submit} disabled={!prete || creer.isPending} className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-on disabled:opacity-40">
            {creer.isPending ? 'Création…' : 'Créer le client'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-input border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
    </label>
  )
}
