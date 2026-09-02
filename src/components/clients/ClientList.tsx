'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, User, ChevronRight } from 'lucide-react'
import ClientForm from './ClientForm'

interface Client {
  id: string
  name: string
  goal?: string
  weight?: number
  status: 'green' | 'yellow' | 'red'
  lastSession?: string
  overallScore?: number
}

const statusConfig = {
  green: { label: 'Correcto', color: '#22c55e' },
  yellow: { label: 'Revisar', color: '#eab308' },
  red: { label: 'Atención', color: '#ef4444' },
}

export default function ClientList() {
  const { user, setView, selectClient } = useStore()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadClients = () => {
    setLoading(true)
    apiGet('/api/clients').then((data) => {
      setClients(data)
    }).catch(() => {}).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    let cancelled = false
    apiGet('/api/clients').then((data) => {
      if (!cancelled) setClients(data)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.goal?.toLowerCase().includes(search.toLowerCase())
  )

  const openClient = (id: string) => {
    selectClient(id)
    setView('client-detail')
  }

  const handleCreated = () => {
    setShowForm(false)
    loadClients()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-wider text-[#334155]">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'admin' && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#0E7490] hover:bg-[#0C5E74] text-white tracking-wider text-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Nuevo cliente
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="pl-10 h-11 bg-white border-0 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const sc = statusConfig[client.status]
            return (
              <Card
                key={client.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openClient(client.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#0E7490] flex items-center justify-center text-white font-medium">
                      {client.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: sc.color, color: sc.color }}>
                      {sc.label}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-sm">{client.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{client.goal || 'Sin objetivo definido'}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{client.weight ? `${client.weight} kg` : '—'}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-[#334155] transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ClientForm open={showForm} onOpenChange={setShowForm} onCreated={handleCreated} />
    </div>
  )
}