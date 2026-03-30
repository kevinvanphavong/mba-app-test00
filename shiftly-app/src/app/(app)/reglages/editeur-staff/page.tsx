'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter }                         from 'next/navigation'
import { useCurrentUser }                    from '@/hooks/useCurrentUser'
import { useCreateStaff, useUpdateStaff }    from '@/hooks/useStaff'
import api                                   from '@/lib/api'
import type { StaffMember }                  from '@/types/staff'
import StaffEditorList                       from '@/components/staff/StaffEditorList'
import ModalEditStaff                        from '@/components/staff/ModalEditStaff'
import ModalStaffCompetences                 from '@/components/staff/ModalStaffCompetences'

export default function EditeurStaffPage() {
  const router       = useRouter()
  const { user }     = useCurrentUser()
  const createStaff  = useCreateStaff()
  const updateStaff  = useUpdateStaff()

  // ── Données ─────────────────────────────────────────────────────────────────
  const [members,  setMembers]  = useState<StaffMember[]>([])
  const [loading,  setLoading]  = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // ── Modaux ───────────────────────────────────────────────────────────────────
  const [showModal,       setShowModal]       = useState(false)
  const [editMember,      setEditMember]      = useState<StaffMember | null>(null)
  const [showCompModal,   setShowCompModal]   = useState(false)
  const [compMember,      setCompMember]      = useState<StaffMember | null>(null)

  // ── Chargement ───────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await api.get('/editeur/staff')
      setMembers(res.data)
    } catch {
      setApiError('Impossible de charger les membres.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchMembers()
  }, [user, fetchMembers])

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  async function handleSave(data: {
    nom: string; prenom: string | null; email: string; role: 'MANAGER' | 'EMPLOYE'
    tailleHaut: string | null; tailleBas: string | null; pointure: string | null
    actif: boolean; password?: string
  }) {
    try {
      if (editMember) {
        await updateStaff.mutateAsync({ id: editMember.id, ...data })
        setMembers(prev => prev.map(m => m.id === editMember.id ? { ...m, ...data } : m))
      } else {
        if (!data.password) { setApiError('Mot de passe requis pour créer un membre.'); return }
        const res = await createStaff.mutateAsync({ ...data, password: data.password })
        setMembers(prev => [...prev, res])
      }
    } catch {
      setApiError('Impossible de sauvegarder.')
    }
    setShowModal(false)
    setEditMember(null)
  }

  async function handleToggleActif(member: StaffMember) {
    try {
      await updateStaff.mutateAsync({ id: member.id, actif: !member.actif })
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, actif: !m.actif } : m))
    } catch {
      setApiError('Impossible de modifier le statut.')
    }
  }

  return (
    <div className="mx-auto px-4 pb-24 lg:max-w-2xl">
      {/* Header */}
      <div className="py-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-accent text-[13px] font-semibold"
        >
          ← Réglages
        </button>
        <button
          onClick={() => { setEditMember(null); setShowModal(true) }}
          className="w-7 h-7 rounded-[8px] border border-border bg-transparent flex items-center justify-center text-[13px] text-muted hover:border-accent hover:text-accent transition-all"
        >
          ＋
        </button>
      </div>

      <h1 className="font-syne font-extrabold text-[20px] text-text mb-0.5">Gestion du staff</h1>
      <p className="text-[12px] text-muted mb-4">Gérez les membres, leurs rôles et leurs informations</p>

      {apiError && (
        <p className="text-[12px] text-red font-medium mb-3 px-1">{apiError}</p>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-14 bg-surface border border-border rounded-[12px]" />
          ))}
        </div>
      ) : (
        <StaffEditorList
          members={members}
          onEdit={(m) => { setEditMember(m); setShowModal(true) }}
          onToggleActif={handleToggleActif}
          onManageComps={(m) => { setCompMember(m); setShowCompModal(true) }}
          onAdd={() => { setEditMember(null); setShowModal(true) }}
        />
      )}

      <ModalEditStaff
        open={showModal}
        member={editMember}
        onClose={() => { setShowModal(false); setEditMember(null) }}
        onSave={handleSave}
      />

      <ModalStaffCompetences
        open={showCompModal}
        member={compMember}
        onClose={() => { setShowCompModal(false); setCompMember(null) }}
        onPointsChange={(userId, pts) =>
          setMembers(prev => prev.map(m => m.id === userId ? { ...m, points: pts } : m))
        }
      />
    </div>
  )
}
