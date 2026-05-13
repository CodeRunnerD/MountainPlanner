import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import {
  Mountain,
  Map,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Trophy,
  Shield,
  Loader2,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useState, useEffect } from 'react'
import { useAuth } from '#/contexts/AuthContext'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoading, signOut } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    // Check email confirmation
    if (!user.email_confirmed_at) {
      navigate({ to: '/verify-email' })
      return
    }
    // Check approval status
    const approval = user.profile?.approval_status
    if (approval === 'pending_approval' || approval === 'rejected') {
      navigate({ to: '/waiting-approval' })
      return
    }
  }, [isLoading, user, navigate, location.href])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const profile = user?.profile
  const displayName = profile?.display_name || user?.email || 'Usuario'
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
  const role = profile?.role || 'participant'
  const neighborhood = profile?.neighborhood
  const isOrganizer = role === 'organizer' || role === 'expedition_lead'

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/routes', icon: Map, label: 'Rutas' },
    { to: '/trips', icon: Calendar, label: 'Salidas' },
    { to: '/summits', icon: Trophy, label: 'Cumbres' },
    { to: '/profile', icon: User, label: 'Perfil' },
    ...(isOrganizer ? [{ to: '/admin/users', icon: Shield, label: 'Usuarios' } as const] : []),
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card shadow-lg transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">MountainPlanner</span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card/50 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {neighborhood && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {neighborhood}
              </span>
            )}
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function useIsOrganizer() {
  const { user } = useAuth()
  const role = user?.profile?.role
  return role === 'organizer' || role === 'expedition_lead'
}
