/**
 * Helpers Sentry — appelés après login/logout pour tagger les erreurs.
 * @sentry/nextjs doit être installé via : npm install @sentry/nextjs
 */

interface SentryUser {
  id:       number
  email:    string
  role:     string
  centreId: number | null
  centreNom: string | null
}

export function setSentryUser(user: SentryUser | null): void {
  if (typeof window === 'undefined') return

  import('@sentry/nextjs').then(Sentry => {
    if (!user) {
      Sentry.setUser(null)
      return
    }

    Sentry.setUser({ id: String(user.id), email: user.email })
    Sentry.setTag('user_role',  user.role)
    Sentry.setTag('centre_id',  String(user.centreId  ?? ''))
    Sentry.setTag('centre_nom', user.centreNom ?? '')
  }).catch(() => {
    // Sentry non installé — silencieux en développement
  })
}
