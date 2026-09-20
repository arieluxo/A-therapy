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
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, Edit3, Trash2, Dumbbell, X } from 'lucide-react'

const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Isquios', 'Glúteos', 'Pantorrilla', 'Core', 'Full Body']

interface Exercise {
  id: string
  name: string
  muscleGroup?: string
  equipment?: string
  technique?: string
  videoUrl?: string
  notes?: string
}

export default function ExerciseLibrary() {
  const { user } = useStore()
  const isAdmin = user?.role === 'admin'
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editEx, setEditEx] = useState<Exercise | null>(null)
  const [form, setForm] = useState({ name: '', muscleGroup: '', equipment: '', technique: '', videoUrl: '', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiGet('/api/exercises', filter ? { muscleGroup: filter } : undefined).then((data) => {
      if (!cancelled) setExercises(data)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [filter])

  const reloadExercises = () => {
    apiGet('/api/exercises', filter ? { muscleGroup: filter } : undefined).then((data) => {
      setExercises(data)
    }).catch(() => {})
  }

  const resetForm = () => {
    setForm({ name: '', muscleGroup: '', equipment: '', technique: '', videoUrl: '', notes: '' })
    setEditEx(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (ex: Exercise) => {
    setForm({ name: ex.name, muscleGroup: ex.muscleGroup || '', equipment: ex.equipment || '', technique: ex.technique || '', videoUrl: ex.videoUrl || '', notes: ex.notes || '' })
    setEditEx(ex)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name) return
    try {
      if (editEx) {
        await apiPut(`/api/exercises/${editEx.id}`, form)
      } else {
        await apiPost('/api/exercises', form)
      }
      setShowForm(false)
      resetForm()
      reloadExercises()
    } catch {}
  }

  const deleteExercise = async (id: string) => {
    if (!confirm('¿Eliminar este ejercicio?')) return
    try {
      await apiDelete(`/api/exercises/${id}`)
      reloadExercises()
    } catch {}
  }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
  const grouped = MUSCLE_GROUPS.reduce<Record<string, Exercise[]>>((acc, g) => {
    const items = filtered.filter(e => e.muscleGroup === g)
    if (items.length) acc[g] = items
    return acc
  }, {})
  const ungrouped = filtered.filter(e => !e.muscleGroup || !MUSCLE_GROUPS.includes(e.muscleGroup))
  if (ungrouped.length) grouped['Otros'] = ungrouped

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-wider text-ink">Ejercicios</h1>
          <p className="text-sm text-muted-foreground mt-1">{exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button className="bg-brand hover:bg-brand-deep text-white text-sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1.5" /> Nuevo ejercicio
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ejercicio..." className="pl-10 h-10 bg-white border-0 shadow-sm" />
        </div>
        <Select value={filter} onValueChange={v => setFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 bg-white border-0 shadow-sm"><SelectValue placeholder="Grupo muscular" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron ejercicios</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{group}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(ex => (
                  <Card key={ex.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {ex.equipment && <Badge variant="secondary" className="text-[10px]">{ex.equipment}</Badge>}
                            {ex.technique && <Badge variant="outline" className="text-[10px]">{ex.technique}</Badge>}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0 ml-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ex)}><Edit3 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteExercise(ex.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); setShowForm(open) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-light tracking-wider">{editEx ? 'Editar ejercicio' : 'Nuevo ejercicio'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs uppercase">Nombre *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Grupo muscular</Label>
              <Select value={form.muscleGroup} onValueChange={v => setForm(f => ({...f, muscleGroup: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{MUSCLE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs uppercase">Equipamiento</Label><Input value={form.equipment} onChange={e => setForm(f => ({...f, equipment: e.target.value}))} className="mt-1" placeholder="Máquina, peso libre, etc." /></div>
            <div><Label className="text-xs uppercase">Técnica</Label><Input value={form.technique} onChange={e => setForm(f => ({...f, technique: e.target.value}))} className="mt-1" placeholder="Bilateral, unilateral, etc." /></div>
            <div><Label className="text-xs uppercase">URL vídeo</Label><Input value={form.videoUrl} onChange={e => setForm(f => ({...f, videoUrl: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="mt-1" rows={2} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { resetForm(); setShowForm(false) }}>Cancelar</Button>
            <Button onClick={save} className="bg-brand hover:bg-brand-deep text-white">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
