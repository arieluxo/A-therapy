'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiPost('/api/auth/login', { email, password })
      login(data.token, data.user)
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f5] p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <Image src="/logo.png" alt="A-THERAPY" width={120} height={120} className="rounded-lg" />
          <div className="text-center">
            <h1 className="text-2xl font-light tracking-[0.3em] text-[#2D4A3E]">A-THERAPY</h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wider">STRENGTH · SCIENCE · PERFORMANCE</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs tracking-wider uppercase">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs tracking-wider uppercase">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#2D4A3E] hover:bg-[#1E352C] text-white tracking-wider text-sm uppercase"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Acceder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
