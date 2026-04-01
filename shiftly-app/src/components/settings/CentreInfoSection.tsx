'use client'

import { useState, useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUpdateCentre } from '@/hooks/useCentre'
import { ty } from '@/lib/typography'

/**
 * Section "Informations du centre" dans la page réglages.
 * Permet au manager de modifier nom, adresse, téléphone, site web.
 */
export default function CentreInfoSection() {
  const { user } = useCurrentUser()
  const mutation  = useUpdateCentre()

  const centre = user?.centre
  const isManager = user?.role === 'MANAGER'

  const [nom, setNom]             = useState('')
  const [adresse, setAdresse]     = useState('')
  const [telephone, setTelephone] = useState('')
  const [siteWeb, setSiteWeb]     = useState('')
  const [saved, setSaved]         = useState(false)

  // Pré-remplir les champs quand les données arrivent
  useEffect(() => {
    if (!centre) return
    setNom(centre.nom ?? '')
    setAdresse(centre.adresse ?? '')
    setTelephone(centre.telephone ?? '')
    setSiteWeb(centre.siteWeb ?? '')
  }, [centre])

  if (!isManager || !centre) return null

  const handleSave = () => {
    mutation.mutate(
      {
        nom:       nom.trim() || centre.nom,
        adresse:   adresse.trim() || null,
        telephone: telephone.trim() || null,
        siteWeb:   siteWeb.trim() || null,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      },
    )
  }

  const fields = [
    { label: 'Nom du centre', value: nom,       onChange: setNom,       placeholder: 'Bowling Central' },
    { label: 'Adresse',       value: adresse,    onChange: setAdresse,   placeholder: '12 rue des Loisirs, 75001 Paris' },
    { label: 'Téléphone',     value: telephone,  onChange: setTelephone, placeholder: '01 23 45 67 89' },
    { label: 'Site web',      value: siteWeb,    onChange: setSiteWeb,   placeholder: 'https://bowling-central.fr' },
  ]

  return (
    <div>
      <div className="bg-surface border border-border rounded-[18px] overflow-hidden p-4 space-y-3">
        {fields.map(f => (
          <div key={f.label}>
            <label className={`${ty.label} block mb-1`}>{f.label}</label>
            <input
              type="text"
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-muted/50 outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="w-full mt-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50"
        >
          {mutation.isPending ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer les modifications'}
        </button>

        {mutation.isError && (
          <p className="text-[11px] text-red text-center">
            Erreur lors de la sauvegarde. Réessayez.
          </p>
        )}
      </div>
    </div>
  )
}
