'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Users, Plus, Edit3, Shield, Trash2 } from 'lucide-react'

interface UserItem {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  clientId?: string
}

export default function AdminPanel() {
  const { user } = useStore()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' })

  useEffect(() => {
    let cancelled = false
    apiGet('/api/users').then((data) => {
      if (!cancelled) setUsers(data)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const reloadUsers = () => {
    apiGet('/api/users').then((data) => {
      setUsers(data)
    }).catch(() => {})
  }

  if (user?.role !== 'admin') {
    return <div className="text-center py-12 text-muted-foreground">Acceso no autorizado</div>
  }

  const openNew = () => {
    setForm({ name: '', email: '', password: '', role: 'client' })
    setEditUser(null)
    setShowForm(true)
  }

  const openEdit = (u: UserItem) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setEditUser(u)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name || !form.email) return
    try {
      if (editUser) {
        await apiPut(`/api/users/${editUser.id}`, { ...form, password: form.password || undefined })
      } else {
        if (!form.password) return
        await apiPost('/api/users', form)
      }
      setShowForm(false)
      reloadUsers()
    } catch {}
  }

  const toggleActive = async (u: UserItem) => {
    try {
      if (u.isActive) {
        await apiDelete(`/api/users/${u.id}`)
      } else {
        await apiPut(`/api/users/${u.id}`, { isActive: true })
      }
      reloadUsers()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wider text-[#2D4A3E]">Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de usuarios y configuración</p>
        </div>
        <Button className="bg-[#2D4A3E] hover:bg-[#1E352C] text-white text-sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> Nuevo usuario
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4" /> Usuarios del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay usuarios</div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium ${u.role === 'admin' ? 'bg-[#2D4A3E]' : 'bg-muted-foreground/30'}`}>
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px]" style={u.role === 'admin' ? { backgroundColor: '#2D4A3E' } : {}}>
                      {u.role === 'admin' ? 'Admin' : 'Cliente'}
                    </Badge>
                    <Switch checked={u.isActive} onCheckedChange={() => toggleActive(u)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Edit3 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import placeholder */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Importar datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Importar datos desde archivo Excel</p>
            <p className="text-xs text-muted-foreground">Funcionalidad próximamente disponible</p>
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-light tracking-wider">{editUser ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs uppercase">Nombre *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">{editUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Rol</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-[#2D4A3E] hover:bg-[#1E352C] text-white">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
