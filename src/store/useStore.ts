'use client'

import { create } from 'zustand'

type View =
  | 'login'
  | 'dashboard'
  | 'clients'
  | 'client-detail'
  | 'training'
  | 'sessions'
  | 'questionnaire'
  | 'exercises'
  | 'admin'
  | 'progress'
  | 'client-home'
  | 'client-training'
  | 'client-sessions'
  | 'client-questionnaire'
  | 'client-progress'

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
  clientId?: string
}

interface AppState {
  view: View
  user: UserInfo | null
  token: string | null
  selectedClientId: string | null
  sidebarOpen: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => void
  setView: (view: View) => void
  selectClient: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

const getInitial = () => {
  if (typeof window === 'undefined') return { token: null, user: null }
  return {
    token: localStorage.getItem('at-token'),
    user: JSON.parse(localStorage.getItem('at-user') || 'null'),
  }
}

export const useStore = create<AppState>((set) => ({
  view: 'dashboard',
  user: null,
  token: null,
  selectedClientId: null,
  sidebarOpen: false,

  login: (token, user) => {
    localStorage.setItem('at-token', token)
    localStorage.setItem('at-user', JSON.stringify(user))
    set({ token, user, view: user.role === 'client' ? 'client-home' : 'dashboard', selectedClientId: null })
  },

  logout: () => {
    localStorage.removeItem('at-token')
    localStorage.removeItem('at-user')
    set({ token: null, user: null, view: 'login', selectedClientId: null })
  },

  setView: (view) => set({ view }),
  selectClient: (id) => set({ selectedClientId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

export type { View, UserInfo }
