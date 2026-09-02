'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import LoginForm from '@/components/auth/LoginForm'
import Sidebar from '@/components/layout/Sidebar'
import DashboardView from '@/components/dashboard/DashboardView'
import ClientList from '@/components/clients/ClientList'
import ClientDetail from '@/components/clients/ClientDetail'
import ClientDashboard from '@/components/clients/ClientDashboard'
import ExerciseLibrary from '@/components/exercises/ExerciseLibrary'
import AdminPanel from '@/components/admin/AdminPanel'
import { apiPost } from '@/lib/api'

export default function AppShell() {
  const { user, token, view, selectClient, selectedClientId } = useStore()

  useEffect(() => {
    if (token && !user) {
      useStore.setState({
        user: JSON.parse(localStorage.getItem('at-user') || 'null'),
      })
    }
  }, [])

  useEffect(() => {
    apiPost('/api/auth/seed').catch(() => {})
  }, [])

  if (!user || !token) return <LoginForm />

  // Client views — completely separate from admin
  if (user.role === 'client') {
    // "Inicio" shows the personalized dashboard
    if (view === 'client-home') {
      return (
        <div className="flex min-h-screen bg-[#f5f5f5]">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              <ClientDashboard />
            </div>
          </main>
        </div>
      )
    }

    // All other client views → ClientDetail with the right tab
    const clientId = user.clientId || selectedClientId
    if (clientId) {
      return (
        <div className="flex min-h-screen bg-[#f5f5f5]">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              <ClientDetail clientId={clientId} />
            </div>
          </main>
        </div>
      )
    }

    // Fallback to dashboard if no clientId
    return (
      <div className="flex min-h-screen bg-[#f5f5f5]">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <ClientDashboard />
          </div>
        </main>
      </div>
    )
  }

  // Admin views
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView />
      case 'clients':
        return selectedClientId ? <ClientDetail clientId={selectedClientId} /> : <ClientList />
      case 'client-detail':
        return selectedClientId ? <ClientDetail clientId={selectedClientId} /> : <ClientList />
      case 'training':
      case 'sessions':
      case 'questionnaire':
      case 'progress':
        return selectedClientId ? <ClientDetail clientId={selectedClientId} /> : <ClientList />
      case 'exercises':
        return <ExerciseLibrary />
      case 'admin':
        return <AdminPanel />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">{renderView()}</div>
      </main>
    </div>
  )
}
