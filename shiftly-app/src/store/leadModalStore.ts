import { create } from 'zustand'

export type LeadIntent = 'trial' | 'demo' | 'custom'
export type LeadPlan = 'starter' | 'pro' | 'premium' | 'undecided'

type LeadModalState = {
  isOpen: boolean
  intent: LeadIntent
  plan: LeadPlan
  open: (intent?: LeadIntent, plan?: LeadPlan) => void
  close: () => void
  setIntent: (intent: LeadIntent) => void
  setPlan: (plan: LeadPlan) => void
}

export const useLeadModal = create<LeadModalState>((set) => ({
  isOpen: false,
  intent: 'demo',
  plan: 'pro',
  open: (intent = 'demo', plan = 'pro') => set({ isOpen: true, intent, plan }),
  close: () => set({ isOpen: false }),
  setIntent: (intent) => set({ intent }),
  setPlan: (plan) => set({ plan }),
}))
