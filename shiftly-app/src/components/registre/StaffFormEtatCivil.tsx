'use client'

/**
 * Carte « État civil & adresse » du registre du personnel.
 * Champs : date de naissance, sexe (M/F), commune + département de
 * naissance, nationalité, adresse postale complète, téléphone.
 *
 * Présentationnel — le parent (ModalRegistreFiche) tient les states.
 */

import { StaffFormCard, StaffFormField, STAFF_FORM_INPUT } from '@/components/staff/StaffFormCard'
import type { Sexe } from '@/types/staff'

interface Props {
  dateNaissance:            string
  sexe:                     Sexe | ''
  lieuNaissanceCommune:     string
  lieuNaissanceDepartement: string
  nationalite:              string
  adresse:                  string
  codePostal:               string
  ville:                    string
  telephone:                string
  onDateNaissance:            (v: string) => void
  onSexe:                     (v: Sexe | '') => void
  onLieuNaissanceCommune:     (v: string) => void
  onLieuNaissanceDepartement: (v: string) => void
  onNationalite:              (v: string) => void
  onAdresse:                  (v: string) => void
  onCodePostal:               (v: string) => void
  onVille:                    (v: string) => void
  onTelephone:                (v: string) => void
}

export default function StaffFormEtatCivil(p: Props) {
  return (
    <StaffFormCard ico="⌂" title="État civil & adresse">
      <div className="grid grid-cols-2 gap-2.5">
        <StaffFormField label="Date de naissance">
          <input
            type="date"
            value={p.dateNaissance}
            onChange={(e) => p.onDateNaissance(e.target.value)}
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
        <StaffFormField label="Sexe">
          <div className="flex gap-1.5">
            {(['M', 'F'] as const).map((s) => {
              const on = p.sexe === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => p.onSexe(on ? '' : s)}
                  className={`flex-1 px-2 py-2 rounded-[8px] text-[12px] font-bold border transition-colors ${
                    on ? 'bg-accent/10 border-accent/40 text-accent' : 'border-border text-muted'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </StaffFormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StaffFormField label="Commune de naissance">
          <input
            value={p.lieuNaissanceCommune}
            onChange={(e) => p.onLieuNaissanceCommune(e.target.value)}
            placeholder="Blois"
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
        <StaffFormField label="Département">
          <input
            value={p.lieuNaissanceDepartement}
            onChange={(e) => p.onLieuNaissanceDepartement(e.target.value)}
            placeholder="Loir-et-Cher (41)"
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
      </div>

      <StaffFormField label="Nationalité">
        <input
          value={p.nationalite}
          onChange={(e) => p.onNationalite(e.target.value)}
          placeholder="Française"
          className={STAFF_FORM_INPUT}
        />
      </StaffFormField>

      <StaffFormField label="Adresse">
        <input
          value={p.adresse}
          onChange={(e) => p.onAdresse(e.target.value)}
          placeholder="12 rue des Vignes"
          className={STAFF_FORM_INPUT}
        />
      </StaffFormField>

      <div className="grid grid-cols-[100px_1fr] gap-2.5">
        <StaffFormField label="Code postal">
          <input
            value={p.codePostal}
            onChange={(e) => p.onCodePostal(e.target.value.toUpperCase())}
            placeholder="41000"
            className={STAFF_FORM_INPUT}
            maxLength={10}
          />
        </StaffFormField>
        <StaffFormField label="Ville">
          <input
            value={p.ville}
            onChange={(e) => p.onVille(e.target.value)}
            placeholder="Blois"
            className={STAFF_FORM_INPUT}
          />
        </StaffFormField>
      </div>

      <StaffFormField label="Téléphone">
        <input
          value={p.telephone}
          onChange={(e) => p.onTelephone(e.target.value)}
          placeholder="06 12 34 56 78"
          className={STAFF_FORM_INPUT}
          maxLength={20}
        />
      </StaffFormField>
    </StaffFormCard>
  )
}
