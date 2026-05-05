/**
 * Formate une chaîne ISO (avec timezone) en heure locale "HH:MM" pour le navigateur.
 * Le back émet du \DateTimeInterface::ATOM, le front rend en Europe/Paris automatiquement.
 */
export function formatHeure(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
