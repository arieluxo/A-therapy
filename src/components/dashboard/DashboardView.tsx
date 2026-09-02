'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface ClientStatus {
  id: string
  name: string
  goal?: string
  weight?: number
  status: 'green' | 'yellow' | 'red'
  lastSession?: string
  latestQuestionnaireDate?: string
  overallScore?: number
}

const statusConfig = {
  green: { label: 'Correcto', color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200' },
  yellow: { label: 'Revisar', color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  red: { label: 'Atención', color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function DashboardView() {
  const { user, setView, selectClient } = useStore()
  const [clients, setClients] = useState<ClientStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'client') return
    let cancelled = false
    apiGet('/api/clients').then((data) => {
      if (!cancelled) setClients(data)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.role])

  const openClient = (id: string) => {
    selectClient(id)
    setView('client-detail')
  }

  const green = clients.filter((c) => c.status === 'green').length
  const yellow = clients.filter((c) => c.status === 'yellow').length
  const red = clients.filter((c) => c.status === 'red').length
  const total = clients.length

  const pieData = [
    { name: 'Correcto', value: green, color: '#22c55e' },
    { name: 'Revisar', value: yellow, color: '#eab308' },
    { name: 'Atención', value: red, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  if (user?.role === 'client') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-light tracking-wider">Bienvenido, {user.name}</h1>
        <p className="text-muted-foreground">Tu perfil de entrenamiento está disponible en la sección de clientes.</p>
        <Button
          onClick={() => {
            if (user.clientId) {
              selectClient(user.clientId)
              setView('client-detail')
            }
          }}
          className="bg-[#0E7490] hover:bg-[#0C5E74]"
        >
          Ver mi perfil
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wider text-[#334155]">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Vista general de tus clientes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-3xl font-light mt-1">{total}</p>
              </div>
              <Users className="h-8 w-8 text-[#334155]/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Correcto</p>
                <p className="text-3xl font-light mt-1 text-green-600">{green}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revisar</p>
                <p className="text-3xl font-light mt-1 text-yellow-600">{yellow}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Atención</p>
                <p className="text-3xl font-light mt-1 text-red-600">{red}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client Status Chart */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Estado general
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
          <div className="px-6 pb-4 flex gap-4 justify-center">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </Card>

        {/* Client List */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Clientes
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-[#334155]" onClick={() => setView('clients')}>
                Ver todos <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <Clock className="h-5 w-5 animate-spin mr-2" /> Cargando...
                </div>
              ) : clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay clientes registrados. Crea tu primer cliente para empezar.
                </p>
              ) : (
                clients.slice(0, 10).map((client) => {
                  const sc = statusConfig[client.status]
                  return (
                    <button
                      key={client.id}
                      onClick={() => openClient(client.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#0C5E74]/5 transition-colors text-left ${sc.bg} ${sc.border} border`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#0E7490] flex items-center justify-center text-white text-xs font-medium shrink-0">
                          {client.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.goal || 'Sin objetivo'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {client.weight && <span className="text-xs text-muted-foreground">{client.weight}kg</span>}
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: sc.color, color: sc.color }}>
                          {sc.label}
                        </Badge>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
