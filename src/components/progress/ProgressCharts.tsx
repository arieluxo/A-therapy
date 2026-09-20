'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ProgressChartsProps {
  clientId: string
  sessions: any[]
  measurements: any[]
}

export default function ProgressCharts({ clientId, sessions, measurements }: ProgressChartsProps) {
  const weightData = useMemo(() => {
    return [...measurements]
      .filter((m) => m.weight)
      .reverse()
      .map((m) => ({
        date: format(new Date(m.date), 'd MMM', { locale: es }),
        weight: m.weight,
      }))
  }, [measurements])

  const strengthData = useMemo(() => {
    const exMap = new Map<string, { name: string; data: { date: string; weight: number }[] }>()
    sessions.forEach((session) => {
      const dateStr = format(new Date(session.date), 'd MMM', { locale: es })
      session.exercises?.forEach((ex: Record<string, unknown>) => {
        const name = ex.exerciseName as string
        if (!name) return
        const sets = ex.sets as Record<string, unknown>[]
        const maxWeight = sets.reduce((max: number, s: Record<string, unknown>) => {
          const w = (s.weight as number) || 0
          return w > max ? w : max
        }, 0)
        if (maxWeight <= 0) return
        if (!exMap.has(name)) {
          exMap.set(name, { name, data: [] })
        }
        exMap.get(name)!.data.push({ date: dateStr, weight: maxWeight })
      })
    })

    // Get top 4 exercises by frequency
    const sorted = [...exMap.values()].sort((a, b) => b.data.length - a.data.length).slice(0, 4)
    if (sorted.length === 0) return null

    // Combine into single data array
    const dates = new Set<string>()
    sorted.forEach((s) => s.data.forEach((d) => dates.add(d.date)))
    const dateArr = [...dates].slice(-10)

    return dateArr.map((date) => {
      const point: Record<string, unknown> = { date }
      sorted.forEach((s) => {
        const entry = s.data.find((d) => d.date === date)
        point[s.name] = entry ? entry.weight : null
      })
      return point
    })
  }, [sessions])

  const volumeData = useMemo(() => {
    const map = new Map<string, number>()
    sessions.forEach((session) => {
      session.exercises?.forEach((ex: Record<string, unknown>) => {
        const name = ex.exerciseName as string
        if (!name) return
        const vol = (ex.volume as number) || 0
        map.set(name, (map.get(name) || 0) + vol)
      })
    })
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, volume]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, volume }))
  }, [sessions])

  const complianceData = useMemo(() => {
    // Simple: count sessions per week for last 8 weeks
    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = now - (8 - i) * weekMs
      const end = start + weekMs
      const count = sessions.filter((s) => {
        const d = new Date(s.date).getTime()
        return d >= start && d < end
      }).length
      return {
        week: `S${i + 1}`,
        sesiones: count,
      }
    })
    return weeks
  }, [sessions])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Progreso</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Evolution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Evolución de peso</CardTitle>
          </CardHeader>
          <CardContent>
            {weightData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#999" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(v: number) => [`${v} kg`, 'Peso']}
                    />
                    <Line type="monotone" dataKey="weight" stroke="var(--chart-1)" strokeWidth={2} dot={{ fill: 'var(--chart-1)', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sin datos de peso</div>
            )}
          </CardContent>
        </Card>

        {/* Strength Progression */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Progresión de fuerza</CardTitle>
          </CardHeader>
          <CardContent>
            {strengthData && strengthData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={strengthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    {Object.keys(strengthData[0])
                      .filter((k) => k !== 'date')
                      .map((key, i) => {
                        const colors = ['var(--chart-1)', '#eab308', '#ef4444', '#22c55e']
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[i % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls
                          />
                        )
                      })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sin datos de fuerza</div>
            )}
          </CardContent>
        </Card>

        {/* Volume per exercise */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Volumen por ejercicio</CardTitle>
          </CardHeader>
          <CardContent>
            {volumeData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#999" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volumen']}
                    />
                    <Bar dataKey="volume" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sin datos de volumen</div>
            )}
          </CardContent>
        </Card>

        {/* Training Compliance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cumplimiento de entrenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            {complianceData.some((w) => w.sesiones > 0) ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#999" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#999" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(v: number) => [`${v} sesiones`, 'Sesiones']}
                    />
                    <Bar dataKey="sesiones" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sin datos de sesiones</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
