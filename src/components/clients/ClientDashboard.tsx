'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { apiGet } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dumbbell, ClipboardList, Activity, TrendingUp, Calendar, ChevronRight,
  Loader2, BarChart3, Zap,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface TrainingDay {
  dayNumber: number
  dayName?: string
  exercises?: Array<{ exerciseName: string; prescribedSets?: number; prescribedReps?: string }>
}

interface ClientData {
  id: string
  name: string
  goal?: string
  weight?: number
  trainings?: Array<{
    id: string
    name: string
    isActive: boolean
    mesocycle?: number
    week?: number
    days?: TrainingDay[]
  }>
  sessions?: Array<{
    id: string
    date: string
    totalVolume?: number
    rpe?: number
    notes?: string
    exercises?: Array<{ exerciseName: string; sets?: Array<{ reps?: number; weight?: number }> }>
  }>
  questionnaires?: Array<{ id: string; date: string; overallScore?: number }>
  measurements?: Array<{ id: string; date: string; weight?: number }>
}

export default function ClientDashboard() {
  const { user, setView, selectClient } = useStore()

  const navigateTo = (v: 'client-training' | 'client-sessions' | 'client-questionnaire' | 'client-progress') => {
    if (user?.clientId) selectClient(user.clientId)
    setView(v)
  }

  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.clientId) return
    let cancelled = false
    apiGet(`/api/clients/${user.clientId}`).then((data) => {
      if (!cancelled) setClient(data)
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.clientId])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#334155]" /></div>
  }

  if (!client) {
    return <p className="text-center py-20 text-muted-foreground">No se encontró tu perfil</p>
  }

  const activeTraining = client.trainings?.find(t => t.isActive)
  const lastSession = client.sessions?.[0]
  const latestQ = client.questionnaires?.[0]
  const lastMeasurement = client.measurements?.[0]
  const weightData = (client.measurements || [])
    .filter(m => m.weight)
    .map(m => ({ date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }), peso: m.weight }))
    .reverse()
  const volumeData = (client.sessions || [])
    .slice(0, 10)
    .reverse()
    .map(s => ({ date: new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }), volumen: s.totalVolume || 0 }))

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score?: number) => {
    if (!score) return '[&>div]:bg-muted'
    if (score >= 70) return '[&>div]:bg-green-500'
    if (score >= 40) return '[&>div]:bg-yellow-500'
    return '[&>div]:bg-red-500'
  }

  const totalSessions = client.sessions?.length || 0
  const totalVolume = client.sessions?.reduce((sum, s) => sum + (s.totalVolume || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-wider text-[#334155]">
          Hola, {client.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Aquí tienes tu resumen de entrenamiento</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Peso actual</p>
            <p className="text-2xl font-light mt-1">{lastMeasurement?.weight ? `${lastMeasurement.weight} kg` : '—'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sesiones</p>
            <p className="text-2xl font-light mt-1">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Volumen total</p>
            <p className="text-2xl font-light mt-1">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Estado</p>
            <div className={`text-2xl font-light mt-1 ${getScoreColor(latestQ?.overallScore)}`}>
              {latestQ?.overallScore ? `${Math.round(latestQ.overallScore)}%` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Training */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="h-4 w-4" /> Mi entrenamiento
              </CardTitle>
              {activeTraining && (
                <Button variant="ghost" size="sm" className="text-xs text-[#334155]" onClick={() => navigateTo('client-training')}>
                  Ver todo <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeTraining ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{activeTraining.name || `M${activeTraining.mesocycle} - S${activeTraining.week}`}</p>
                  <Badge className="text-[10px] bg-[#0E7490] hover:bg-[#0C5E74]">Activo</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeTraining.days?.slice(0, 6).map((day, i) => (
                    <div key={i} className="border rounded-lg p-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[#334155]">{day.dayName || `Día ${day.dayNumber}`}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{day.exercises?.length || 0} ejercicios</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay programa activo</p>
            )}
          </CardContent>
        </Card>

        {/* Latest Questionnaire */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Mi estado
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-[#334155]" onClick={() => navigateTo('client-questionnaire')}>
                {latestQ ? 'Histórico' : 'Rellenar'} <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {latestQ ? (
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`text-4xl font-light ${getScoreColor(latestQ.overallScore)}`}>{Math.round(latestQ.overallScore || 0)}%</div>
                  <div className="flex-1">
                    <Progress value={latestQ.overallScore || 0} className={`h-2 ${getScoreBg(latestQ.overallScore)}`} />
                    <p className="text-xs text-muted-foreground mt-1">{new Date(latestQ.date).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                {!latestQ.overallScore || latestQ.overallScore < 70 ? (
                  <Button variant="outline" className="w-full mt-2 text-xs" onClick={() => navigateTo('client-questionnaire')}>
                    <Zap className="h-3.5 w-3.5 mr-1.5" /> Actualizar seguimiento
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Aún no has rellenado el cuestionario</p>
                <Button variant="outline" className="text-xs" onClick={() => navigateTo('client-questionnaire')}>
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Rellenar ahora
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Session + Weight Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Last Session */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4" /> Última sesión
              </CardTitle>
              {client.sessions && client.sessions.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-[#334155]" onClick={() => navigateTo('client-sessions')}>
                  Ver todas <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {lastSession ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(lastSession.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  {lastSession.rpe && <Badge variant="outline" className="text-[10px]">RPE {lastSession.rpe}</Badge>}
                </div>
                <div className="space-y-1.5">
                  {lastSession.exercises?.slice(0, 5).map((ex, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate">{ex.exerciseName}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{ex.sets?.length || 0} series</span>
                    </div>
                  ))}
                  {(lastSession.exercises?.length || 0) > 5 && (
                    <p className="text-[10px] text-muted-foreground">+{(lastSession.exercises?.length || 0) - 5} ejercicios más</p>
                  )}
                </div>
                {lastSession.totalVolume && lastSession.totalVolume > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <BarChart3 className="h-3.5 w-3.5 text-[#334155]" />
                    <span className="text-xs text-muted-foreground">Volumen: <strong className="text-foreground">{lastSession.totalVolume.toLocaleString('es-ES')} kg</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Aún no hay sesiones registradas</p>
            )}
          </CardContent>
        </Card>

        {/* Weight Evolution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Evolución de peso
              </CardTitle>
              {weightData.length > 3 && (
                <Button variant="ghost" size="sm" className="text-xs text-[#334155]" onClick={() => navigateTo('client-progress')}>
                  Ver más <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {weightData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="peso" stroke="#334155" strokeWidth={2} dot={{ r: 3, fill: '#334155' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                {weightData.length === 1 ? `Peso actual: ${weightData[0].peso} kg` : 'Se necesitan al menos 2 mediciones'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume Chart */}
      {volumeData.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Volumen por sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="volumen" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
