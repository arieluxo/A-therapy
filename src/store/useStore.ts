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

function loadStoredSession(): { token: string | null; user: UserInfo | null } {
  if (typeof window === 'undefined') return { token: null, user: null }
  try {
    const token = localStorage.getItem('at-token')
    const raw = localStorage.getItem('at-user')
    return { token, user: raw ? (JSON.parse(raw) as UserInfo) : null }
  } catch {
    return { token: null, user: null }
  }
}

// Se evalúa al cargar el módulo en el cliente: restaura la sesión
// guardada para que recargar la página no expulse al login.
const stored = loadStoredSession()

export const useStore = create<AppState>((set) => ({
  view: stored.user?.role === 'client' ? 'client-home' : 'dashboard',
  user: stored.user,
  token: stored.token,
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
