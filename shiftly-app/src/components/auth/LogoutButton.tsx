'use client'

import { useLogout } from '@/hooks/useAuth'

export default function LogoutButton() {
  const logout = useLogout()

  return (
    <button
      onClick={() => logout()}
      className="w-full text-left px-4 py-3 flex items-center justify-between"
    >
      <div>
        <div className="text-[13px] text-red font-medium">Se déconnecter</div>
        <div className="text-[11px] text-muted">Fermer la session en cours</div>
      </div>
      <span className="text-muted">→</span>
    </button>
  )
}
