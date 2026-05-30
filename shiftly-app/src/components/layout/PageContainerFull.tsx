import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  className?: string
}

// Conteneur de page pleine largeur : même padding que PageContainer, sans
// max-width. Réservé aux outils opérationnels temps réel (service, planning,
// validation hebdo) qui doivent exploiter toute la zone disponible après la
// Sidebar.
const BASE = 'w-full px-4 pt-6 pb-28 desktop:px-7 desktop:pt-8 desktop:pb-10'

export default function PageContainerFull({ children, className }: Props) {
  return <div className={twMerge(BASE, className)}>{children}</div>
}
