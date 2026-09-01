'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import LoginForm from '@/components/auth/LoginForm'
import Sidebar from '@/components/layout/Sidebar'
import DashboardView from '@/components/dashboard/DashboardView'
import ClientList from '@/components/clients/ClientList'
import ClientDetail from '@/components/clients/ClientDetail'
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

  useEffect(() => {
    if (user?.role === 'client' && user.clientId && !selectedClientId) {
      selectClient(user.clientId)
    }
  }, [user, selectedClientId, selectClient])

  if (!user || !token) return <LoginForm />

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return user.role === 'client' && selectedClientId ? (
          <ClientDetail clientId={selectedClientId} />
        ) : (
          <DashboardView />
        )
      case 'clients':
        return selectedClientId ? (
          <ClientDetail clientId={selectedClientId} />
        ) : (
          <ClientList />
        )
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
        return user.role === 'admin' ? <AdminPanel /> : <DashboardView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f8f7f5]">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">{renderView()}</div>
      </main>
    </div>
  )
}