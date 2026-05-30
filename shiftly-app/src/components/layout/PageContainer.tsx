import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  className?: string
}

// Conteneur de page standard : centré, max 1400px en desktop.
// À utiliser par défaut sur toutes les pages (app)/ sauf opérationnel temps réel
// (service, planning, validation) qui doivent prendre toute la largeur — voir
// PageContainerFull pour ce cas.
const BASE = 'w-full px-4 pt-6 pb-28 desktop:px-7 desktop:pt-8 desktop:pb-10 desktop:max-w-[1400px] desktop:mx-auto'

export default function PageContainer({ children, className }: Props) {
  return <div className={twMerge(BASE, className)}>{children}</div>
}
