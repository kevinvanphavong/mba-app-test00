'use client'

import { useCompleterMissionHaccp } from '@/hooks/useHaccp'
import HaccpModalTemperature from './HaccpModalTemperature'
import HaccpModalDlc         from './HaccpModalDlc'
import HaccpModalPhoto       from './HaccpModalPhoto'
import HaccpModalReception   from './HaccpModalReception'
import type { MissionHaccpSpec } from '@/types/haccp'

interface Props {
  open: boolean
  onClose: () => void
  posteId: number
  missionId: number
  missionTexte: string
  spec: MissionHaccpSpec
  onSuccess?: () => void
}

/** Dispatch vers la variante de modal selon spec.typeReleve. */
export default function HaccpCheckModal({ open, onClose, posteId, missionId, missionTexte, spec, onSuccess }: Props) {
  const completer = useCompleterMissionHaccp()

  const wrap = async (payload: {
    valeurNumerique?: number
    dateReleve?:      string
    note?:            string
    photo?:           File
  }) => {
    await completer.mutateAsync({
      posteId,
      missionId,
      valeurNumerique: payload.valeurNumerique ?? null,
      dateReleve:      payload.dateReleve ?? null,
      note:            payload.note ?? null,
      photo:           payload.photo ?? null,
    })
    onClose()
    onSuccess?.()
  }

  const common = {
    open,
    onClose,
    missionTexte,
    spec,
    loading: completer.isPending,
  }

  switch (spec.typeReleve) {
    case 'TEMPERATURE': return <HaccpModalTemperature {...common} onSubmit={wrap} />
    case 'DLC':         return <HaccpModalDlc         {...common} onSubmit={wrap} />
    case 'PHOTO':       return <HaccpModalPhoto       {...common} onSubmit={wrap} />
    case 'RECEPTION':   return <HaccpModalReception   {...common} onSubmit={wrap} />
    default:            return null
  }
}
