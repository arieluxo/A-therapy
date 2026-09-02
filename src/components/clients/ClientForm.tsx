'use client'

import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  editData?: Record<string, unknown>
}

export default function ClientForm({ open, onOpenChange, onCreated, editData }: Props) {
  const [form, setForm] = useState({
    name: '', age: '', height: '', weight: '', goal: '', experienceLevel: '',
    injuries: '', weeklyAvailability: '', notes: '',
    email: '', password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Nombre, email y contraseña son obligatorios')
      return
    }
    setLoading(true)
    try {
      await apiPost('/api/clients', {
        name: form.name,
        age: form.age ? parseInt(form.age) : null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        goal: form.goal || null,
        experienceLevel: form.experienceLevel || null,
        injuries: form.injuries || null,
        weeklyAvailability: form.weeklyAvailability || null,
        notes: form.notes || null,
        email: form.email,
        password: form.password,
      })
      setForm({ name: '', age: '', height: '', weight: '', goal: '', experienceLevel: '', injuries: '', weeklyAvailability: '', notes: '', email: '', password: '' })
      onCreated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cliente'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-light tracking-wider">Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs uppercase tracking-wider">Nombre completo *</Label>
              <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1" placeholder="Nombre y apellidos" required />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Edad</Label>
              <Input type="number" value={form.age} onChange={(e) => handleChange('age', e.target.value)} className="mt-1" placeholder="28" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Altura (cm)</Label>
              <Input type="number" value={form.height} onChange={(e) => handleChange('height', e.target.value)} className="mt-1" placeholder="175" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Peso (kg)</Label>
              <Input type="number" step="0.1" value={form.weight} onChange={(e) => handleChange('weight', e.target.value)} className="mt-1" placeholder="75" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Objetivo</Label>
              <Select value={form.goal} onValueChange={(v) => handleChange('goal', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="Fuerza">Fuerza</SelectItem>
                  <SelectItem value="Resistencia">Resistencia</SelectItem>
                  <SelectItem value="Recomposición corporal">Recomposición corporal</SelectItem>
                  <SelectItem value="Pérdida de peso">Pérdida de peso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Nivel experiencia</Label>
              <Select value={form.experienceLevel} onValueChange={(v) => handleChange('experienceLevel', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Principiante">Principiante</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Disponibilidad</Label>
              <Input value={form.weeklyAvailability} onChange={(e) => handleChange('weeklyAvailability', e.target.value)} className="mt-1" placeholder="Lun-Mié-Vie" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs uppercase tracking-wider">Lesiones / Limitaciones</Label>
              <Textarea value={form.injuries} onChange={(e) => handleChange('injuries', e.target.value)} className="mt-1" rows={2} placeholder="Describe cualquier lesión o limitación" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs uppercase tracking-wider">Notas</Label>
              <Textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} className="mt-1" rows={2} placeholder="Notas adicionales" />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Acceso del cliente</p>
            <div>
              <Label className="text-xs uppercase tracking-wider">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="mt-1" placeholder="cliente@email.com" required />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Contraseña *</Label>
              <Input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="mt-1" placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Crear cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
