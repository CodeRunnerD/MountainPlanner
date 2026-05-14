import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import {
  Users,
  CheckCircle2,
  XCircle,
  Mail,
  Search,
  Loader2,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Ban,
  RotateCcw,
} from 'lucide-react'
import type { Tables } from '#/types/database.types'

type Profile = Tables<'profiles'>

export const Route = createFileRoute('/_app/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | null>(null)

  const fetchProfiles = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const openConfirmModal = (profile: Profile, action: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
    setSelectedProfile(profile)
    setPendingAction(action)
    setModalOpen(true)
  }

  const executeAction = async () => {
    if (!selectedProfile || !pendingAction) return
    setActionLoading(selectedProfile.id)

    let newStatus: Profile['approval_status']
    switch (pendingAction) {
      case 'approve':
        newStatus = 'active'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'suspend':
        newStatus = 'suspended'
        break
      case 'reactivate':
        newStatus = 'active'
        break
      default:
        newStatus = 'active'
    }

    await supabase.from('profiles').update({ approval_status: newStatus }).eq('id', selectedProfile.id)
    await fetchProfiles()
    setActionLoading(null)
    setModalOpen(false)
    setSelectedProfile(null)
    setPendingAction(null)
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending_email: { label: 'Email pendiente', className: 'bg-amber-100 text-amber-700' },
    pending_approval: { label: 'Pendiente', className: 'bg-blue-100 text-blue-700' },
    active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
    suspended: { label: 'Suspendido', className: 'bg-orange-100 text-orange-700' },
    rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
  }

  const filtered = profiles.filter((p) => {
    const matchesFilter = filter === 'all' || p.approval_status === filter
    const matchesSearch =
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const pendingCount = profiles.filter((p) => p.approval_status === 'pending_approval').length

  // Helper to check if current user can manage this profile
  const canManage = (profile: Profile) => {
    // Can't manage yourself
    if (profile.id === user?.id) return false
    return true
  }

  // Helper to get available actions for a profile
  const getActions = (profile: Profile): ('approve' | 'reject' | 'suspend' | 'reactivate')[] => {
    if (!canManage(profile)) return []
    switch (profile.approval_status) {
      case 'pending_email':
        return ['reject']
      case 'pending_approval':
        return ['approve', 'reject']
      case 'active':
        return ['suspend', 'reject']
      case 'suspended':
        return ['reactivate', 'reject']
      case 'rejected':
        return ['reactivate']
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Confirmation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {pendingAction === 'approve' && 'Confirmar aprobación'}
              {pendingAction === 'reject' && 'Confirmar rechazo'}
              {pendingAction === 'suspend' && 'Confirmar suspensión'}
              {pendingAction === 'reactivate' && 'Confirmar reactivación'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'approve' &&
                `¿Estás seguro de que quieres aprobar a ${selectedProfile?.display_name}? Podrá acceder a la plataforma.`}
              {pendingAction === 'reject' &&
                `¿Estás seguro de que quieres rechazar a ${selectedProfile?.display_name}? No podrá acceder a la plataforma.`}
              {pendingAction === 'suspend' &&
                `¿Estás seguro de que quieres suspender a ${selectedProfile?.display_name}? Perderá acceso hasta ser reactivado.`}
              {pendingAction === 'reactivate' &&
                `¿Estás seguro de que quieres reactivar a ${selectedProfile?.display_name}? Recuperará acceso a la plataforma.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={pendingAction === 'reject' || pendingAction === 'suspend' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={actionLoading === selectedProfile?.id}
            >
              {actionLoading === selectedProfile?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingAction === 'approve' && 'Aprobar'}
              {pendingAction === 'reject' && 'Rechazar'}
              {pendingAction === 'suspend' && 'Suspender'}
              {pendingAction === 'reactivate' && 'Reactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Volver al dashboard
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Gestión de usuarios
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las solicitudes de acceso a la plataforma
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-blue-100 text-blue-700 border-0">
            {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { value: profiles.length, label: 'Total usuarios', icon: Users },
          { value: profiles.filter((p) => p.approval_status === 'pending_email').length, label: 'Email pendiente', icon: Mail },
          { value: pendingCount, label: 'Pendientes', icon: Shield },
          { value: profiles.filter((p) => p.approval_status === 'active').length, label: 'Activos', icon: CheckCircle2 },
          { value: profiles.filter((p) => p.approval_status === 'suspended').length, label: 'Suspendidos', icon: Ban },
        ].map((stat) => (
          <Card key={stat.label} className="border-border shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'pending_email', label: 'Email pendiente' },
            { value: 'pending_approval', label: 'Pendientes' },
            { value: 'active', label: 'Activos' },
            { value: 'suspended', label: 'Suspendidos' },
            { value: 'rejected', label: 'Rechazados' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((profile) => {
          const actions = getActions(profile)
          return (
            <Card key={profile.id} className="border-border shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                  alt={profile.display_name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{profile.display_name}</p>
                    <Badge className={`${statusConfig[profile.approval_status].className} border-0 text-xs capitalize`}>
                      {statusConfig[profile.approval_status].label}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {profile.role}
                    </Badge>
                    {profile.id === user?.id && (
                      <Badge variant="secondary" className="text-xs">Tú</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.phone || 'Sin teléfono'} · {profile.neighborhood || 'Sin barrio'} ·{' '}
                    {new Date(profile.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {actions.includes('approve') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => openConfirmModal(profile, 'approve')}
                      disabled={actionLoading === profile.id}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aprobar
                    </Button>
                  )}
                  {actions.includes('reject') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => openConfirmModal(profile, 'reject')}
                      disabled={actionLoading === profile.id}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rechazar
                    </Button>
                  )}
                  {actions.includes('suspend') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => openConfirmModal(profile, 'suspend')}
                      disabled={actionLoading === profile.id}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Suspender
                    </Button>
                  )}
                  {actions.includes('reactivate') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => openConfirmModal(profile, 'reactivate')}
                      disabled={actionLoading === profile.id}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reactivar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay usuarios que coincidan con tu búsqueda.
          </p>
        )}
      </div>
    </div>
  )
}
