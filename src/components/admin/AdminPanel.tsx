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
import { Users, Plus, Edit3, Shield, Trash2, Mail, KeyRound, Link2, UserCheck, UserX } from 'lucide-react'

interface UserItem {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  clientId?: string
  client?: { id: string; name: string } | null
  createdAt: string
}

export default function AdminPanel() {
  const { user } = useStore()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    apiGet('/api/users').then((data) => {
      if (!cancelled) setUsers(Array.isArray(data) ? data : [])
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const reloadUsers = () => {
    apiGet('/api/users').then((data) => {
      setUsers(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }

  if (user?.role !== 'admin') {
    return <div className="text-center py-12 text-muted-foreground">Acceso no autorizado</div>
  }

  const openNew = () => {
    setForm({ name: '', email: '', password: '', role: 'client' })
    setEditUser(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (u: UserItem) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setEditUser(u)
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    setError('')
    try {
      if (editUser) {
        const payload: Record<string, string | boolean> = { name: form.name, email: form.email, role: form.role }
        if (form.password) payload.password = form.password
        await apiPut(`/api/users/${editUser.id}`, payload)
      } else {
        if (!form.password) {
          setError('La contraseña es obligatoria para nuevos usuarios')
          setSaving(false)
          return
        }
        await apiPost('/api/users', form)
      }
      setShowForm(false)
      reloadUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      if (msg.includes('409') || msg.includes('email')) {
        setError('El email ya está en uso')
      } else {
        setError('Error al guardar. Inténtalo de nuevo.')
      }
    } finally {
      setSaving(false)
    }
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

  const adminCount = users.filter(u => u.role === 'admin').length
  const clientCount = users.filter(u => u.role === 'client').length
  const activeCount = users.filter(u => u.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wider text-ink">Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de accesos y usuarios</p>
        </div>
        <Button className="bg-brand hover:bg-brand-deep text-white text-sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> Nuevo acceso
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-light text-ink">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total usuarios</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-light text-ink">{clientCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-light text-emerald-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Users list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4" /> Todos los accesos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay usuarios. Crea el primer acceso.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${u.role === 'admin' ? 'bg-brand' : 'bg-stone-400'}`}>
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] shrink-0" style={u.role === 'admin' ? { backgroundColor: 'var(--brand)' } : {}}>
                          {u.role === 'admin' ? 'Admin' : 'Cliente'}
                        </Badge>
                        {u.isActive ? (
                          <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <UserX className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {u.email}
                      </p>
                      {u.client && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                          <Link2 className="h-2.5 w-2.5" /> Perfil: {u.client.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} title="Editar acceso"><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Switch checked={u.isActive} onCheckedChange={() => toggleActive(u)} className="scale-90" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-0 shadow-sm bg-brand/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-ink">Cómo funciona:</span> Al crear un acceso de tipo <strong>Cliente</strong>, se genera automáticamente su perfil de cliente. Al crear un acceso de tipo <strong>Admin</strong>, solo se crea el usuario sin perfil. Puedes editar el email y la contraseña de cualquier usuario desde aquí o desde el perfil del cliente.
          </p>
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
          <DialogHeader>
            <DialogTitle className="text-lg font-light tracking-wider">{editUser ? 'Editar acceso' : 'Nuevo acceso'}</DialogTitle>
          </DialogHeader>
          {error && <p className="text-xs text-red-500 -mt-2">{error}</p>}
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase">Nombre *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" placeholder="Nombre completo" />
            </div>
            <div>
              <Label className="text-xs uppercase flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <Label className="text-xs uppercase flex items-center gap-1.5"><KeyRound className="h-3 w-3" /> {editUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="mt-1" placeholder="••••••••" />
            </div>
            <div>
              <Label className="text-xs uppercase">Rol</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({...f, role: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1.5">{form.role === 'client' ? 'Se creará automáticamente un perfil de cliente vinculado' : 'Solo acceso de administración, sin perfil de cliente'}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-brand hover:bg-brand-deep text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
