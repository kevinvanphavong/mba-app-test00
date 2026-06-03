import type {
  LeadActivity,
  LeadIntent,
  LeadPlan,
  LeadStatus,
} from '@/types/lead'

/** Source de vérité pour libellés / couleurs / emojis des Leads côté UI. */

export const INTENT_META: Record<LeadIntent, { label: string; emoji: string; description: string }> = {
  trial:  { label: 'Essai gratuit',     emoji: '🟢', description: 'Veut tester Shiftly 14 jours' },
  demo:   { label: 'Démo en visio',     emoji: '🎥', description: 'Demande un rendez-vous démo' },
  custom: { label: 'Projet sur mesure', emoji: '🛠️', description: 'Besoins spécifiques à chiffrer' },
}

export const PLAN_META: Record<LeadPlan, { label: string; badgeClass: string; mrr: number }> = {
  starter:   { label: 'Starter',  badgeClass: 'bg-muted/15 text-muted',   mrr: 49  },
  pro:       { label: 'Pro',      badgeClass: 'bg-blue/15 text-blue',     mrr: 99  },
  premium:   { label: 'Premium',  badgeClass: 'bg-purple/15 text-purple', mrr: 199 },
  undecided: { label: 'Indécis',  badgeClass: 'bg-surface2 text-muted',   mrr: 0   },
}

export const STATUS_META: Record<LeadStatus, { label: string; badgeClass: string; dotClass: string }> = {
  nouveau:  { label: 'Nouveau',   badgeClass: 'bg-accent/15 text-accent', dotClass: 'bg-accent' },
  contacte: { label: 'Contacté',  badgeClass: 'bg-blue/15 text-blue',     dotClass: 'bg-blue'   },
  qualifie: { label: 'Qualifié',  badgeClass: 'bg-yellow/15 text-yellow', dotClass: 'bg-yellow' },
  converti: { label: 'Converti',  badgeClass: 'bg-green/15 text-green',   dotClass: 'bg-green'  },
  perdu:    { label: 'Perdu',     badgeClass: 'bg-red/15 text-red',       dotClass: 'bg-red'    },
}

export const ACTIVITY_LABEL: Record<LeadActivity, string> = {
  bowling: 'Bowling',
  laser:   'Laser game',
  arcade:  'Arcade',
  karaoke: 'Karaoké',
  vr:      'Réalité virtuelle',
  mixte:   'Mixte',
  autre:   'Autre',
}

export const STATUS_ORDER: LeadStatus[] = ['nouveau', 'contacte', 'qualifie', 'converti', 'perdu']
