'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft, Plus, Trash2, Copy, Calendar, FileText, Activity,
  ClipboardList, Save, Loader2, ChevronDown, ChevronUp, BarChart3, Edit3,
  KeyRound, Mail, ShieldCheck, ShieldX,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface Props {
  clientId: string
}

interface TrainingExercise {
  id?: string
  exerciseName: string
  exerciseId?: string
  order: number
  prescribedSets?: number
  prescribedReps?: string
  prescribedRir?: string
  prescribedRpe?: number
  prescribedRest?: number
  prescribedTempo?: string
  prescribedWeight?: number
  notes?: string
}

interface TrainingDay {
  id?: string
  dayNumber: number
  dayName?: string
  exercises: TrainingExercise[]
}

interface Training {
  id: string
  name: string
  mesocycle?: number
  week?: number
  isActive: boolean
  days: TrainingDay[]
}

interface SessionSet {
  id?: string
  setNumber: number
  reps?: number
  weight?: number
  rir?: number
  rpe?: number
}

interface SessionExercise {
  id?: string
  exerciseName: string
  order: number
  sets: SessionSet[]
  volume?: number
}

interface Session {
  id: string
  date: string
  notes?: string
  rpe?: number
  totalVolume?: number
  exercises: SessionExercise[]
  dayNumber?: number
}

interface Questionnaire {
  id: string
  date: string
  sleepQuality?: number
  fatigue?: number
  stress?: number
  motivation?: number
  pain?: number
  energy?: number
  hunger?: number
  adherence?: number
  trainingFeeling?: number
  overallScore?: number
  notes?: string
}

interface Measurement {
  id: string
  date: string
  weight?: number
  chest?: number
  waist?: number
  hips?: number
}

interface ClientData {
  id: string
  name: string
  age?: number
  height?: number
  weight?: number
  goal?: string
  experienceLevel?: string
  injuries?: string
  weeklyAvailability?: string
  notes?: string
  status: 'green' | 'yellow' | 'red'
  trainings: Training[]
  sessions: Session[]
  questionnaires: Questionnaire[]
  measurements: Measurement[]
  trainerNotes: { id: string; content: string; createdAt: string }[]
}

const qFields = [
  { key: 'sleepQuality', label: 'Calidad del sueño', icon: '😴' },
  { key: 'fatigue', label: 'Fatiga', icon: '😫' },
  { key: 'stress', label: 'Estrés', icon: '😰' },
  { key: 'motivation', label: 'Motivación', icon: '💪' },
  { key: 'pain', label: 'Dolor/molestias', icon: '🤕' },
  { key: 'energy', label: 'Energía', icon: '⚡' },
  { key: 'hunger', label: 'Hambre', icon: '🍽️' },
  { key: 'adherence', label: 'Adherencia', icon: '✅' },
  { key: 'trainingFeeling', label: 'Sensaciones entrenamiento', icon: '🏋️' },
]

export default function ClientDetail({ clientId }: Props) {
  const { user, view, setView, selectClient } = useStore()
  const isAdmin = user?.role === 'admin'
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(    view === 'sessions' || view === 'client-sessions' ? 'sessions' :    view === 'questionnaire' || view === 'client-questionnaire' ? 'questionnaire' :    view === 'training' || view === 'client-training' ? 'training' :    view === 'progress' || view === 'client-progress' ? 'progress' :    'profile'  )
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [trainerNote, setTrainerNote] = useState('')

  // Training state
  const [showTrainingForm, setShowTrainingForm] = useState(false)
  const [trainingForm, setTrainingForm] = useState<Training>({ id: '', name: '', isActive: true, days: [] })
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessionForm, setSessionForm] = useState<Session>({ id: '', date: new Date().toISOString(), exercises: [] })
  const [sessionDayNumber, setSessionDayNumber] = useState<number | undefined>(undefined)
  const [sessionPrescription, setSessionPrescription] = useState<TrainingDay | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [qForm, setQForm] = useState<Record<string, number>>({})
  const [qNotes, setQNotes] = useState('')
  const [showMeasurement, setShowMeasurement] = useState(false)
  const [measForm, setMeasForm] = useState<Record<string, string>>({})

  // Credential editing state (admin only)
  const [editCredentials, setEditCredentials] = useState(false)
  const [credForm, setCredForm] = useState({ email: '', password: '' })
  const [savingCreds, setSavingCreds] = useState(false)
  const [credError, setCredError] = useState('')
  const [credSuccess, setCredSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    apiGet(`/api/clients/${clientId}`).then((data) => {
      if (cancelled) return
      setClient(data)
      if (data) {
        setEditForm({
          name: data.name || '',
          age: data.age?.toString() || '',
          height: data.height?.toString() || '',
          weight: data.weight?.toString() || '',
          goal: data.goal || '',
          experienceLevel: data.experienceLevel || '',
          injuries: data.injuries || '',
          weeklyAvailability: data.weeklyAvailability || '',
          notes: data.notes || '',
        })
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [clientId])

  const reloadClient = () => {
    apiGet(`/api/clients/${clientId}`).then((data) => {
      setClient(data)
      if (data) {
        setEditForm({
          name: data.name || '',
          age: data.age?.toString() || '',
          height: data.height?.toString() || '',
          weight: data.weight?.toString() || '',
          goal: data.goal || '',
          experienceLevel: data.experienceLevel || '',
          injuries: data.injuries || '',
          weeklyAvailability: data.weeklyAvailability || '',
          notes: data.notes || '',
        })
      }
    }).catch(() => {})
  }

  const saveCredentials = async () => {
    if (!client?.user?.id) return
    setCredError('')
    setCredSuccess('')
    setSavingCreds(true)
    try {
      const payload: Record<string, string> = {}
      if (credForm.email && credForm.email !== client.user.email) {
        payload.email = credForm.email
      }
      if (credForm.password) {
        payload.password = credForm.password
      }
      if (Object.keys(payload).length === 0) {
        setCredError('No hay cambios que guardar')
        setSavingCreds(false)
        return
      }
      await apiPut(`/api/users/${client.user.id}`, payload)
      setCredSuccess('Acceso actualizado correctamente')
      setEditCredentials(false)
      setCredForm({ email: '', password: '' })
      reloadClient()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      if (msg.includes('409') || msg.includes('email')) {
        setCredError('El email ya está en uso')
      } else {
        setCredError('Error al guardar los cambios')
      }
    } finally {
      setSavingCreds(false)
    }
  }

  const saveProfile = async () => {
    try {
      await apiPut(`/api/clients/${clientId}`, {
        name: editForm.name,
        age: editForm.age ? parseInt(editForm.age) : null,
        height: editForm.height ? parseFloat(editForm.height) : null,
        weight: editForm.weight ? parseFloat(editForm.weight) : null,
        goal: editForm.goal || null,
        experienceLevel: editForm.experienceLevel || null,
        injuries: editForm.injuries || null,
        weeklyAvailability: editForm.weeklyAvailability || null,
        notes: editForm.notes || null,
      })
      setEditMode(false)
      reloadClient()
    } catch {}
  }

  const addTrainerNote = async () => {
    if (!trainerNote.trim()) return
    try {
      await apiPost(`/api/clients/${clientId}`, { action: 'addNote', content: trainerNote })
      setTrainerNote('')
      reloadClient()
    } catch {}
  }

  // Training helpers
  const addTrainingDay = () => {
    const num = trainingForm.days.length + 1
    setTrainingForm({
      ...trainingForm,
      days: [...trainingForm.days, { dayNumber: num, dayName: `Día ${num}`, exercises: [] }],
    })
  }

  const addExerciseToDay = (dayIdx: number) => {
    const days = [...trainingForm.days]
    days[dayIdx] = {
      ...days[dayIdx],
      exercises: [...days[dayIdx].exercises, { exerciseName: '', order: days[dayIdx].exercises.length, prescribedSets: 3, prescribedReps: '8-12', prescribedRir: '1-2' }],
    }
    setTrainingForm({ ...trainingForm, days })
  }

  const updateExercise = (dayIdx: number, exIdx: number, field: string, value: string | number) => {
    const days = [...trainingForm.days]
    const exercises = [...days[dayIdx].exercises]
    exercises[exIdx] = { ...exercises[exIdx], [field]: value }
    days[dayIdx] = { ...days[dayIdx], exercises }
    setTrainingForm({ ...trainingForm, days })
  }

  const removeExercise = (dayIdx: number, exIdx: number) => {
    const days = [...trainingForm.days]
    days[dayIdx] = { ...days[dayIdx], exercises: days[dayIdx].exercises.filter((_, i) => i !== exIdx) }
    setTrainingForm({ ...trainingForm, days })
  }

  const removeTrainingDay = (dayIdx: number) => {
    const days = trainingForm.days.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, dayNumber: i + 1 }))
    setTrainingForm({ ...trainingForm, days })
  }

  const saveTraining = async () => {
    try {
      const body = {
        name: trainingForm.name,
        mesocycle: trainingForm.mesocycle || 1,
        week: trainingForm.week || 1,
        clientId,
        days: trainingForm.days.map((d) => ({
          dayNumber: d.dayNumber,
          dayName: d.dayName,
          exercises: d.exercises.map((e) => ({
            exerciseName: e.exerciseName,
            order: e.order,
            prescribedSets: e.prescribedSets,
            prescribedReps: e.prescribedReps,
            prescribedRir: e.prescribedRir,
            prescribedRpe: e.prescribedRpe,
            prescribedRest: e.prescribedRest,
            prescribedTempo: e.prescribedTempo,
            prescribedWeight: e.prescribedWeight,
            notes: e.notes,
          })),
        })),
      }
      if (trainingForm.id) {
        await apiPut(`/api/trainings/${trainingForm.id}`, body)
      } else {
        await apiPost('/api/trainings', body)
      }
      setShowTrainingForm(false)
      setTrainingForm({ id: '', name: '', isActive: true, days: [] })
      reloadClient()
    } catch {}
  }

  const duplicateTraining = async (t: Training) => {
    try {
      await apiGet(`/api/trainings/${t.id}?duplicate=true`)
      reloadClient()
    } catch {}
  }

  const deleteTraining = async (id: string) => {
    try {
      await apiDelete(`/api/trainings/${id}`)
      reloadClient()
    } catch {}
  }

  // Session helpers
  const startSession = (dayIdx: number) => {
    const activeTraining = client?.trainings.find(t => t.isActive)
    const day = activeTraining?.days[dayIdx]
    if (!day) return
    setSessionDayNumber(day.dayNumber)
    setSessionPrescription(day)
    setSessionForm({
      id: '', date: new Date().toISOString(),
      exercises: day.exercises.map((e) => ({
        exerciseName: e.exerciseName,
        order: e.order,
        sets: Array.from({ length: e.prescribedSets || 3 }, (_, i) => ({ setNumber: i + 1 })),
      })),
    })
    setShowSessionForm(true)
  }

  const openBlankSession = () => {
    setSessionDayNumber(undefined)
    setSessionPrescription(null)
    setSessionForm({ id: '', date: new Date().toISOString(), exercises: [{ exerciseName: '', order: 0, sets: [{ setNumber: 1 }] }] })
    setShowSessionForm(true)
  }

  const addSetToExercise = (exIdx: number) => {
    const exercises = [...sessionForm.exercises]
    const sets = [...exercises[exIdx].sets]
    sets.push({ setNumber: sets.length + 1 })
    exercises[exIdx] = { ...exercises[exIdx], sets }
    setSessionForm({ ...sessionForm, exercises })
  }

  const updateSessionSet = (exIdx: number, setIdx: number, field: string, value: number | undefined) => {
    const exercises = [...sessionForm.exercises]
    const sets = [...exercises[exIdx].sets]
    sets[setIdx] = { ...sets[setIdx], [field]: value }
    exercises[exIdx] = { ...exercises[exIdx], sets }
    setSessionForm({ ...sessionForm, exercises })
  }

  const saveSession = async () => {
    try {
      const activeTraining = client?.trainings.find(t => t.isActive)
      await apiPost('/api/sessions', {
        clientId,
        trainingId: activeTraining?.id,
        dayNumber: sessionDayNumber,
        notes: sessionForm.notes,
        rpe: sessionForm.rpe,
        exercises: sessionForm.exercises.map((e) => ({
          exerciseName: e.exerciseName,
          order: e.order,
          sets: e.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            rir: s.rir,
            rpe: s.rpe,
          })),
        })),
      })
      setShowSessionForm(false)
      setSessionForm({ id: '', date: new Date().toISOString(), exercises: [] })
      setSessionDayNumber(undefined)
      setSessionPrescription(null)
      reloadClient()
    } catch {}
  }

  // Questionnaire
  const saveQuestionnaire = async () => {
    try {
      await apiPost('/api/questionnaires', {
        clientId,
        sleepQuality: qForm.sleepQuality,
        fatigue: qForm.fatigue,
        stress: qForm.stress,
        motivation: qForm.motivation,
        pain: qForm.pain,
        energy: qForm.energy,
        hunger: qForm.hunger,
        adherence: qForm.adherence,
        trainingFeeling: qForm.trainingFeeling,
        notes: qNotes,
      })
      setShowQuestionnaire(false)
      setQForm({})
      setQNotes('')
      reloadClient()
    } catch {}
  }

  // Measurement
  const saveMeasurement = async () => {
    try {
      await apiPost('/api/measurements', {
        clientId,
        weight: measForm.weight ? parseFloat(measForm.weight) : null,
        chest: measForm.chest ? parseFloat(measForm.chest) : null,
        waist: measForm.waist ? parseFloat(measForm.waist) : null,
        hips: measForm.hips ? parseFloat(measForm.hips) : null,
      })
      setShowMeasurement(false)
      setMeasForm({})
      reloadClient()
    } catch {}
  }

  const deleteClient = async () => {
    if (!confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) return
    try {
      await apiDelete(`/api/clients/${clientId}`)
      selectClient(null)
      setView('clients')
    } catch {}
  }

  const statusConfig = {
    green: { label: 'Correcto', color: '#22c55e', bg: 'bg-green-50' },
    yellow: { label: 'Revisar', color: '#eab308', bg: 'bg-yellow-50' },
    red: { label: 'Atención', color: '#ef4444', bg: 'bg-red-50' },
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-muted'
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Cargando...</div>
  if (!client) return <div className="text-center py-12 text-muted-foreground">Cliente no encontrado</div>

  const sc = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.red
  const latestQ = client.questionnaires?.[0]
  const weightData = client.measurements?.filter(m => m.weight).map(m => ({ date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), peso: m.weight })) || []
  const volumeData = client.sessions?.slice(-10).map(s => ({ date: new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), volumen: s.totalVolume || 0 })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => { selectClient(null); setView('clients') }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-light tracking-wider text-[#334155]">{client.name}</h1>
            <Badge variant="outline" className="text-xs" style={{ borderColor: sc.color, color: sc.color }}>{sc.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{client.goal || 'Sin objetivo'}{client.weight ? ` · ${client.weight} kg` : ''}</p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={deleteClient}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm p-1 h-auto flex-wrap gap-1 flex rounded-lg">
        {[
          { value: 'profile', label: 'Perfil', icon: <Activity className="h-3.5 w-3.5 mr-1.5" /> },
          { value: 'training', label: 'Entrenamiento', icon: <FileText className="h-3.5 w-3.5 mr-1.5" /> },
          { value: 'sessions', label: 'Sesiones', icon: <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> },
          { value: 'questionnaire', label: 'Cuestionario', icon: <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> },
          { value: 'progress', label: 'Progreso', icon: <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${activeTab === tab.value ? 'bg-[#0E7490] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

        {/* PROFILE TAB */}
      {activeTab === 'profile' && <div className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Datos personales</CardTitle>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(!editMode)}>
                      <Edit3 className="h-3.5 w-3.5 mr-1" /> {editMode ? 'Cancelar' : 'Editar'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editMode && isAdmin ? (
                  <div className="space-y-3">
                    <div><Label className="text-xs uppercase">Nombre</Label><Input value={editForm.name} onChange={(e) => setEditForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs uppercase">Edad</Label><Input type="number" value={editForm.age} onChange={(e) => setEditForm(f => ({...f, age: e.target.value}))} className="mt-1" /></div>
                      <div><Label className="text-xs uppercase">Altura (cm)</Label><Input type="number" value={editForm.height} onChange={(e) => setEditForm(f => ({...f, height: e.target.value}))} className="mt-1" /></div>
                      <div><Label className="text-xs uppercase">Peso (kg)</Label><Input type="number" step="0.1" value={editForm.weight} onChange={(e) => setEditForm(f => ({...f, weight: e.target.value}))} className="mt-1" /></div>
                      <div><Label className="text-xs uppercase">Objetivo</Label>
                        <Select value={editForm.goal} onValueChange={(v) => setEditForm(f => ({...f, goal: v}))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                            <SelectItem value="Fuerza">Fuerza</SelectItem>
                            <SelectItem value="Resistencia">Resistencia</SelectItem>
                            <SelectItem value="Recomposición corporal">Recomposición corporal</SelectItem>
                            <SelectItem value="Pérdida de peso">Pérdida de peso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label className="text-xs uppercase">Nivel experiencia</Label>
                      <Select value={editForm.experienceLevel} onValueChange={(v) => setEditForm(f => ({...f, experienceLevel: v}))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Principiante">Principiante</SelectItem>
                          <SelectItem value="Intermedio">Intermedio</SelectItem>
                          <SelectItem value="Avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs uppercase">Lesiones</Label><Textarea value={editForm.injuries} onChange={(e) => setEditForm(f => ({...f, injuries: e.target.value}))} className="mt-1" rows={2} /></div>
                    <div><Label className="text-xs uppercase">Disponibilidad</Label><Input value={editForm.weeklyAvailability} onChange={(e) => setEditForm(f => ({...f, weeklyAvailability: e.target.value}))} className="mt-1" /></div>
                    <Button onClick={saveProfile} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white w-full"><Save className="h-4 w-4 mr-2" /> Guardar cambios</Button>
                  </div>
                ) : (
                  <dl className="space-y-3 text-sm">
                    {[
                      ['Edad', client.age ? `${client.age} años` : '—'],
                      ['Altura', client.height ? `${client.height} cm` : '—'],
                      ['Peso', client.weight ? `${client.weight} kg` : '—'],
                      ['Objetivo', client.goal || '—'],
                      ['Nivel', client.experienceLevel || '—'],
                      ['Disponibilidad', client.weeklyAvailability || '—'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{val}</dd></div>
                    ))}
                    {client.injuries && <div><dt className="text-muted-foreground text-xs uppercase">Lesiones</dt><dd className="mt-1 text-xs">{client.injuries}</dd></div>}
                  </dl>
                )}
              </CardContent>
            </Card>

            {/* ACCESS CARD — admin only */}
            {isAdmin && client?.user && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5" /> Acceso del cliente
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {client.user.isActive ? (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><ShieldCheck className="h-3 w-3 mr-1" />Activo</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]"><ShieldX className="h-3 w-3 mr-1" />Inactivo</Badge>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setEditCredentials(!editCredentials); setCredError(''); setCredSuccess(''); setCredForm({ email: client.user.email, password: '' }) }}>
                        <Edit3 className="h-3.5 w-3.5 mr-1" /> {editCredentials ? 'Cancelar' : 'Editar'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {credSuccess && <p className="text-xs text-emerald-600 mb-3">{credSuccess}</p>}
                  {credError && <p className="text-xs text-red-500 mb-3">{credError}</p>}
                  {editCredentials ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs uppercase flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</Label>
                        <Input value={credForm.email} onChange={(e) => setCredForm(f => ({...f, email: e.target.value}))} type="email" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs uppercase flex items-center gap-1.5"><KeyRound className="h-3 w-3" /> Nueva contraseña <span className="text-muted-foreground normal-case">(dejar vacío para no cambiar)</span></Label>
                        <Input value={credForm.password} onChange={(e) => setCredForm(f => ({...f, password: e.target.value}))} type="password" className="mt-1" placeholder="••••••••" />
                      </div>
                      <Button onClick={saveCredentials} disabled={savingCreds} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white w-full">
                        {savingCreds ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar acceso
                      </Button>
                    </div>
                  ) : (
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <dt className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</dt>
                        <dd className="font-medium">{client.user.email}</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-muted-foreground flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Contraseña</dt>
                        <dd className="font-medium text-muted-foreground">••••••••</dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {/* Latest questionnaire score */}
              {latestQ && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Estado general</p>
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-light ${getScoreColor(latestQ.overallScore)}`}>{Math.round(latestQ.overallScore || 0)}%</div>
                      <div className="flex-1">
                        <Progress value={latestQ.overallScore || 0} className={`h-2 ${getScoreBg(latestQ.overallScore)}`} />
                        <p className="text-xs text-muted-foreground mt-1">{new Date(latestQ.date).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick actions */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Acciones rápidas</p>
                  {isAdmin && <Button variant="outline" className="w-full justify-start" onClick={() => setShowMeasurement(true)}><Plus className="h-4 w-4 mr-2" /> Registrar peso/medidas</Button>}
                  {(isAdmin || user?.role === 'client') && <Button variant="outline" className="w-full justify-start" onClick={() => setShowQuestionnaire(true)}><Plus className="h-4 w-4 mr-2" /> Nuevo cuestionario</Button>}
                </CardContent>
              </Card>

              {/* Trainer notes */}
              {isAdmin && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notas del entrenador</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {client.trainerNotes?.map(n => (
                      <div key={n.id} className="text-xs border-l-2 border-[#334155] pl-3 py-1">
                        <p>{n.content}</p>
                        <p className="text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={trainerNote} onChange={(e) => setTrainerNote(e.target.value)} placeholder="Añadir nota..." className="text-sm" onKeyDown={(e) => e.key === 'Enter' && addTrainerNote()} />
                      <Button size="icon" variant="ghost" onClick={addTrainerNote}><Save className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Measurements history */}
          {client.measurements?.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historial de medidas</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">Fecha</th><th className="pb-2 pr-4">Peso</th><th className="pb-2 pr-4">Pecho</th><th className="pb-2 pr-4">Cintura</th><th className="pb-2">Cadera</th>
                    </tr></thead>
                    <tbody>
                      {client.measurements.map(m => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 text-muted-foreground">{new Date(m.date).toLocaleDateString('es-ES')}</td>
                          <td className="py-2 pr-4">{m.weight || '—'}</td>
                          <td className="py-2 pr-4">{m.chest || '—'}</td>
                          <td className="py-2 pr-4">{m.waist || '—'}</td>
                          <td className="py-2">{m.hips || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
      </div>}

        {/* TRAINING TAB */}
      {activeTab === 'training' && <div className="space-y-6 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-medium text-[#334155]">Programas de entrenamiento</h2>
            {isAdmin && (
              <Button className="bg-[#0E7490] hover:bg-[#0C5E74] text-white text-sm" onClick={() => { setTrainingForm({ id: '', name: '', isActive: true, days: [] }); setShowTrainingForm(true) }}>
                <Plus className="h-4 w-4 mr-1.5" /> Nuevo programa
              </Button>
            )}
          </div>

          {!client.trainings?.length ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No hay programas de entrenamiento</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {client.trainings.map((t) => (
                <Card key={t.id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-sm font-medium">{t.name || `M${t.mesocycle} - S${t.week}`}</CardTitle>
                        <Badge variant={t.isActive ? 'default' : 'secondary'} className="text-[10px]" style={t.isActive ? { backgroundColor: '#334155' } : {}}>{t.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => duplicateTraining(t)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => { setTrainingForm(t); setShowTrainingForm(true) }}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteTraining(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {t.days.map((day, dayIdx) => (
                        <div key={day.id || dayIdx} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-[#334155]">{day.dayName || `Día ${day.dayNumber}`}</h4>
                            <span className="text-[10px] text-muted-foreground">{day.exercises.length} ej.</span>
                          </div>
                          {(isAdmin || user?.role === 'client') && (
                            <Button variant="ghost" size="sm" className="w-full mb-2 text-xs text-[#334155]" onClick={() => startSession(dayIdx)}>
                              <Plus className="h-3 w-3 mr-1" /> Registrar sesión
                            </Button>
                          )}
                          <div className="space-y-1">
                            {day.exercises.map((ex, exIdx) => (
                              <div key={ex.id || exIdx} className="text-xs flex justify-between">
                                <span className="truncate">{ex.exerciseName}</span>
                                <span className="text-muted-foreground shrink-0 ml-2">{ex.prescribedSets}×{ex.prescribedReps}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>}

        {/* SESSIONS TAB */}
      {activeTab === 'sessions' && <div className="space-y-6 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-medium text-[#334155]">Sesiones registradas</h2>
            {isAdmin && (
              <Button className="bg-[#0E7490] hover:bg-[#0C5E74] text-white text-sm" onClick={openBlankSession}>
                <Plus className="h-4 w-4 mr-1.5" /> Nueva sesión
              </Button>
            )}
          </div>

          {/* Client: Training day selector to start a session */}
          {!isAdmin && client.trainings?.length > 0 && (
            <Card className="border-0 shadow-sm border-l-4" style={{ borderLeftColor: '#0E7490' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#334155] flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#0E7490]" />
                  Registrar sesión de hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Selecciona el día de tu plan para registrar los datos del entrenamiento:</p>
                {(() => {
                  const activeDays = client.trainings.find(t => t.isActive)?.days
                  if (!activeDays?.length) return <p className="text-xs text-muted-foreground">No hay plan de entrenamiento activo</p>
                  return (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeDays.map((day, dayIdx) => (
                        <button
                          key={day.id || dayIdx}
                          onClick={() => startSession(dayIdx)}
                          className="border rounded-lg p-4 text-left hover:border-[#0E7490] hover:bg-[#0E7490]/5 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#334155]">{day.dayName || `Día ${day.dayNumber}`}</span>
                            <span className="text-[10px] text-muted-foreground">{day.exercises.length} ej.</span>
                          </div>
                          <div className="space-y-1">
                            {day.exercises.slice(0, 4).map((ex, i) => (
                              <div key={i} className="text-xs text-muted-foreground flex justify-between">
                                <span className="truncate">{ex.exerciseName}</span>
                                <span className="shrink-0 ml-2">{ex.prescribedSets}×{ex.prescribedReps}</span>
                              </div>
                            ))}
                            {day.exercises.length > 4 && (
                              <p className="text-[10px] text-muted-foreground">+{day.exercises.length - 4} más...</p>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#0E7490] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-3 w-3" /> Registrar
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {!client.sessions?.length ? (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">No hay sesiones registradas</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {client.sessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
      </div>}

        {/* QUESTIONNAIRE TAB */}
      {activeTab === 'questionnaire' && <div className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-[#334155]">Cuestionario de seguimiento</h2>
            {(isAdmin || user?.role === 'client') && (
              <Button className="bg-[#0E7490] hover:bg-[#0C5E74] text-white text-sm" onClick={() => setShowQuestionnaire(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Nuevo cuestionario
              </Button>
            )}
          </div>

          {latestQ && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-5xl font-light ${getScoreColor(latestQ.overallScore)}`}>{Math.round(latestQ.overallScore || 0)}%</div>
                  <div>
                    <p className="text-sm font-medium">Puntuación global</p>
                    <p className="text-xs text-muted-foreground">{new Date(latestQ.date).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <Progress value={latestQ.overallScore || 0} className={`h-2.5 ${getScoreBg(latestQ.overallScore)}`} />
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {qFields.map(f => (
                    <div key={f.key} className="text-center p-2 rounded bg-muted/50">
                      <p className="text-lg">{f.icon}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{f.label}</p>
                      <p className="text-sm font-medium">{(latestQ as Record<string, unknown>)[f.key] as number || '—'}/10</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {client.questionnaires?.length > 1 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tendencia</CardTitle></CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...client.questionnaires].reverse().map(q => ({ date: new Date(q.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), score: q.overallScore }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#334155" strokeWidth={2} dot={{ fill: '#334155' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {client.questionnaires?.length > 0 && (
            <div className="space-y-2">
              {client.questionnaires.map(q => (
                <Card key={q.id} className="border-0 shadow-sm">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">{new Date(q.date).toLocaleDateString('es-ES')}</span>
                      <span className={`text-sm font-medium ${getScoreColor(q.overallScore)}`}>{Math.round(q.overallScore || 0)}%</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: q.overallScore && q.overallScore >= 70 ? '#22c55e' : q.overallScore && q.overallScore >= 40 ? '#eab308' : '#ef4444', color: q.overallScore && q.overallScore >= 70 ? '#22c55e' : q.overallScore && q.overallScore >= 40 ? '#eab308' : '#ef4444' }}>
                      {q.overallScore && q.overallScore >= 70 ? '🟢' : q.overallScore && q.overallScore >= 40 ? '🟡' : '🔴'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>}

        {/* PROGRESS TAB */}
      {activeTab === 'progress' && <div className="space-y-6 mt-6">
          <h2 className="text-lg font-medium text-[#334155]">Progreso</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {weightData.length > 1 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evolución de peso</CardTitle></CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="peso" stroke="#334155" strokeWidth={2} dot={{ fill: '#334155' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {volumeData.length > 1 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Volumen por sesión</CardTitle></CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="volumen" fill="#334155" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
          {weightData.length <= 1 && volumeData.length <= 1 && (
            <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-muted-foreground">Registra más datos para ver gráficos de progreso</CardContent></Card>
          )}
      </div>}


      {/* DIALOGS */}
      {/* Training Editor Dialog */}
      <Dialog open={showTrainingForm} onOpenChange={setShowTrainingForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-lg font-light tracking-wider">Programa de entrenamiento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label className="text-xs uppercase">Nombre</Label><Input value={trainingForm.name} onChange={(e) => setTrainingForm(f => ({...f, name: e.target.value}))} className="mt-1" placeholder="Ej: Mesociclo 7 - Semana 1" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs uppercase">Meso</Label><Input type="number" value={trainingForm.mesocycle || ''} onChange={(e) => setTrainingForm(f => ({...f, mesocycle: parseInt(e.target.value) || undefined}))} className="mt-1" /></div>
                <div><Label className="text-xs uppercase">Semana</Label><Input type="number" value={trainingForm.week || ''} onChange={(e) => setTrainingForm(f => ({...f, week: parseInt(e.target.value) || undefined}))} className="mt-1" /></div>
              </div>
            </div>

            {trainingForm.days.map((day, dayIdx) => (
              <div key={dayIdx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#334155]">Día {day.dayNumber}</span>
                    <Input value={day.dayName || ''} onChange={(e) => {
                      const days = [...trainingForm.days]
                      days[dayIdx] = {...days[dayIdx], dayName: e.target.value}
                      setTrainingForm({...trainingForm, days})
                    }} className="h-7 w-32 text-xs" placeholder="Nombre del día" />
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 h-7" onClick={() => removeTrainingDay(dayIdx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="border rounded p-3 bg-muted/30 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input value={ex.exerciseName} onChange={(e) => updateExercise(dayIdx, exIdx, 'exerciseName', e.target.value)} className="h-8 flex-1 min-w-[140px] text-sm" placeholder="Nombre del ejercicio" />
                      <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => removeExercise(dayIdx, exIdx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div><Label className="text-[10px] uppercase text-muted-foreground">Series</Label><Input type="number" value={ex.prescribedSets || ''} onChange={(e) => updateExercise(dayIdx, exIdx, 'prescribedSets', parseInt(e.target.value) || 0)} className="h-7 text-xs" /></div>
                      <div><Label className="text-[10px] uppercase text-muted-foreground">Reps</Label><Input value={ex.prescribedReps || ''} onChange={(e) => updateExercise(dayIdx, exIdx, 'prescribedReps', e.target.value)} className="h-7 text-xs" placeholder="8-12" /></div>
                      <div><Label className="text-[10px] uppercase text-muted-foreground">RIR</Label><Input value={ex.prescribedRir || ''} onChange={(e) => updateExercise(dayIdx, exIdx, 'prescribedRir', e.target.value)} className="h-7 text-xs" placeholder="1-2" /></div>
                      <div><Label className="text-[10px] uppercase text-muted-foreground">Descanso(s)</Label><Input type="number" value={ex.prescribedRest || ''} onChange={(e) => updateExercise(dayIdx, exIdx, 'prescribedRest', parseInt(e.target.value) || 0)} className="h-7 text-xs" /></div>
                    </div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground">Notas</Label><Input value={ex.notes || ''} onChange={(e) => updateExercise(dayIdx, exIdx, 'notes', e.target.value)} className="h-7 text-xs" placeholder="Notas del ejercicio" /></div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => addExerciseToDay(dayIdx)}><Plus className="h-3.5 w-3.5 mr-1" /> Añadir ejercicio</Button>
              </div>
            ))}

            <Button variant="outline" className="w-full border-dashed" onClick={addTrainingDay}><Plus className="h-4 w-4 mr-2" /> Añadir día de entrenamiento</Button>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowTrainingForm(false)}>Cancelar</Button>
            <Button onClick={saveTraining} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white">Guardar programa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Logger Dialog */}
      <Dialog open={showSessionForm} onOpenChange={(open) => {
        if (!open) {
          setShowSessionForm(false)
          setSessionPrescription(null)
          setSessionDayNumber(undefined)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-light tracking-wider">
              Registrar sesión
              {sessionPrescription && (
                <span className="text-sm text-muted-foreground ml-2 font-normal">
                  — {sessionPrescription.dayName || `Día ${sessionDayNumber}`}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {sessionForm.exercises.map((ex, exIdx) => {
              const prescribed = sessionPrescription?.exercises[exIdx]
              return (
                <div key={exIdx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#334155]">{ex.exerciseName || `Ejercicio ${exIdx + 1}`}</p>
                    {prescribed && (
                      <Badge variant="outline" className="text-[10px] shrink-0 border-[#0E7490]/30 text-[#0E7490]">
                        {prescribed.prescribedSets}×{prescribed.prescribedReps}
                        {prescribed.prescribedRir ? ` RIR ${prescribed.prescribedRir}` : ''}
                      </Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <Input value={ex.exerciseName} onChange={(e) => {
                      const exercises = [...sessionForm.exercises]
                      exercises[exIdx] = {...exercises[exIdx], exerciseName: e.target.value}
                      setSessionForm({...sessionForm, exercises})
                    }} className="h-8 text-sm" placeholder="Nombre del ejercicio" />
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-muted-foreground">
                        <th className="pb-1 text-left w-10">#</th>
                        <th className="pb-1 text-left w-16">Reps</th>
                        <th className="pb-1 text-left w-16">Kg</th>
                        <th className="pb-1 text-left w-16">RIR</th>
                        <th className="pb-1 text-left w-16">RPE</th>
                      </tr></thead>
                      <tbody>
                        {ex.sets.map((set, setIdx) => (
                          <tr key={setIdx}>
                            <td className="py-1 text-muted-foreground font-medium">{set.setNumber}</td>
                            <td className="py-1"><Input type="number" value={set.reps || ''} onChange={(e) => updateSessionSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || undefined)} className="h-7 w-16 text-xs" placeholder="—" /></td>
                            <td className="py-1"><Input type="number" step="0.5" value={set.weight || ''} onChange={(e) => updateSessionSet(exIdx, setIdx, 'weight', parseFloat(e.target.value) || undefined)} className="h-7 w-16 text-xs" placeholder="—" /></td>
                            <td className="py-1"><Input type="number" value={set.rir || ''} onChange={(e) => updateSessionSet(exIdx, setIdx, 'rir', parseInt(e.target.value) || undefined)} className="h-7 w-16 text-xs" placeholder="—" /></td>
                            <td className="py-1"><Input type="number" min={1} max={10} value={set.rpe || ''} onChange={(e) => updateSessionSet(exIdx, setIdx, 'rpe', parseInt(e.target.value) || undefined)} className="h-7 w-16 text-xs" placeholder="—" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => addSetToExercise(exIdx)}><Plus className="h-3 w-3 mr-1" /> Añadir serie</Button>
                </div>
              )
            })}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => {
                setSessionForm({
                  ...sessionForm,
                  exercises: [...sessionForm.exercises, { exerciseName: '', order: sessionForm.exercises.length, sets: [{ setNumber: 1 }] }]
                })
              }}><Plus className="h-3.5 w-3.5 mr-1" /> Añadir ejercicio</Button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs uppercase">RPE sesión (1-10)</Label><Input type="number" min={1} max={10} value={sessionForm.rpe || ''} onChange={(e) => setSessionForm(f => ({...f, rpe: parseFloat(e.target.value) || undefined}))} className="mt-1" /></div>
              <div><Label className="text-xs uppercase">Notas</Label><Textarea value={sessionForm.notes || ''} onChange={(e) => setSessionForm(f => ({...f, notes: e.target.value}))} className="mt-1" rows={2} /></div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setShowSessionForm(false); setSessionPrescription(null); setSessionDayNumber(undefined) }}>Cancelar</Button>
            <Button onClick={saveSession} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white">
              <Save className="h-4 w-4 mr-1.5" /> Guardar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questionnaire Dialog */}
      <Dialog open={showQuestionnaire} onOpenChange={setShowQuestionnaire}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-lg font-light tracking-wider">Cuestionario de seguimiento</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {qFields.map(f => (
              <div key={f.key}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">{f.icon} {f.label}</Label>
                  <span className="text-sm font-medium text-[#334155]">{qForm[f.key] || 5}/10</span>
                </div>
                <Slider value={[qForm[f.key] || 5]} min={1} max={10} step={1} onValueChange={([v]) => setQForm(prev => ({...prev, [f.key]: v}))} className="[&_[role=slider]]:bg-[#0E7490]" />
              </div>
            ))}
            <div><Label className="text-xs uppercase">Notas</Label><Textarea value={qNotes} onChange={(e) => setQNotes(e.target.value)} className="mt-1" rows={2} placeholder="Observaciones adicionales..." /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowQuestionnaire(false)}>Cancelar</Button>
            <Button onClick={saveQuestionnaire} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white">Enviar cuestionario</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Measurement Dialog */}
      <Dialog open={showMeasurement} onOpenChange={setShowMeasurement}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-lg font-light tracking-wider">Registrar medidas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs uppercase">Peso (kg)</Label><Input type="number" step="0.1" value={measForm.weight || ''} onChange={(e) => setMeasForm(f => ({...f, weight: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Pecho (cm)</Label><Input type="number" step="0.1" value={measForm.chest || ''} onChange={(e) => setMeasForm(f => ({...f, chest: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Cintura (cm)</Label><Input type="number" step="0.1" value={measForm.waist || ''} onChange={(e) => setMeasForm(f => ({...f, waist: e.target.value}))} className="mt-1" /></div>
            <div><Label className="text-xs uppercase">Cadera (cm)</Label><Input type="number" step="0.1" value={measForm.hips || ''} onChange={(e) => setMeasForm(f => ({...f, hips: e.target.value}))} className="mt-1" /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowMeasurement(false)}>Cancelar</Button>
            <Button onClick={saveMeasurement} className="bg-[#0E7490] hover:bg-[#0C5E74] text-white">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(session.date)
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="py-3 px-4">
        <button className="w-full flex items-center justify-between text-left" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="text-xs text-muted-foreground">{session.exercises.length} ejercicio{session.exercises.length !== 1 ? 's' : ''}{session.totalVolume ? ` · ${Math.round(session.totalVolume).toLocaleString()} kg vol.` : ''}{session.dayNumber ? ` · Día ${session.dayNumber}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.rpe && <Badge variant="outline" className="text-[10px]">RPE {session.rpe}</Badge>}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {session.exercises.map((ex, i) => (
              <div key={i}>
                <p className="text-xs font-medium mb-1">{ex.exerciseName}</p>
                <div className="flex flex-wrap gap-1">
                  {ex.sets.map((s, j) => (
                    <span key={j} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {s.reps}×{s.weight || '?'}kg{s.rir != null ? ` RIR${s.rir}` : ''}{s.rpe != null ? ` RPE${s.rpe}` : ''}
                    </span>
                  ))}
                  {ex.volume != null && <span className="text-[10px] text-muted-foreground ml-1">Vol: {Math.round(ex.volume)}kg</span>}
                </div>
              </div>
            ))}
            {session.notes && <p className="text-xs text-muted-foreground italic">{session.notes}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}