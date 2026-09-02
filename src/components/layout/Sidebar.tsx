'use client'

import { useStore, View } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Settings,
  LogOut,
  Menu,
  Home,
  ClipboardList,
  Activity,
  TrendingUp,
} from 'lucide-react'
import Image from 'next/image'

const adminNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { view: 'clients', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { view: 'exercises', label: 'Ejercicios', icon: <Dumbbell className="h-5 w-5" /> },
  { view: 'admin', label: 'Administración', icon: <Settings className="h-5 w-5" /> },
]

const clientNavItems: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'client-home', label: 'Inicio', icon: <Home className="h-5 w-5" /> },
  { view: 'client-training', label: 'Mi entrenamiento', icon: <Dumbbell className="h-5 w-5" /> },
  { view: 'client-sessions', label: 'Mis sesiones', icon: <Activity className="h-5 w-5" /> },
  { view: 'client-questionnaire', label: 'Seguimiento', icon: <ClipboardList className="h-5 w-5" /> },
  { view: 'client-progress', label: 'Progreso', icon: <TrendingUp className="h-5 w-5" /> },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const { user, view, setView, logout, selectClient } = useStore()
  const isAdmin = user?.role === 'admin'
  const navItems = isAdmin ? adminNavItems : clientNavItems

  const navigate = (v: View) => {
    if (!isAdmin) {
      setView(v)
    } else {
      if (v === 'clients' || v === 'dashboard') selectClient(null)
      setView(v)
    }
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <Image src="/logo.png" alt="A-THERAPY" width={36} height={36} className="rounded" />
        <div>
          <h2 className="text-sm font-semibold tracking-[0.2em] text-[#2D4A3E]">A-THERAPY</h2>
          <p className="text-[10px] text-muted-foreground tracking-widest">TRAINING PLATFORM</p>
        </div>
      </div>
      <Separator className="bg-[#2D4A3E]/10" />
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.view}
            variant={view === item.view ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 h-10 text-sm ${view === item.view ? 'bg-[#2D4A3E]/10 text-[#2D4A3E] font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => navigate(item.view)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </nav>
      <Separator className="bg-[#2D4A3E]/10" />
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground truncate">{user?.name}</p>
          <p className="truncate">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-sm text-muted-foreground hover:text-red-600"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r bg-white h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-50 bg-white shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <NavContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
