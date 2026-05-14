import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Layers,
  Car,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Wrench,
  Loader2,
} from 'lucide-react'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type Route = Tables<'routes'>
type Profile = Tables<'profiles'>
type TripParticipant = Tables<'trip_participants'>
type EquipmentReq = Tables<'trip_equipment_requirements'>
type ParticipantEquipment = Tables<'participant_equipment'>
type Vehicle = Tables<'vehicles'>
type TransportAssignment = Tables<'transport_assignments'>

export const Route = createFileRoute('/_app/trips/$tripId')({
  component: TripDetailPage,
})

function TripDetailPage() {
  const { tripId } = Route.useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [organizer, setOrganizer] = useState<Profile | null>(null)
  const [participants, setParticipants] = useState<TripParticipant[]>([])
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, Profile>>({})
  const [equipment, setEquipment] = useState<EquipmentReq[]>([])
  const [participantEquipment, setParticipantEquipment] = useState<ParticipantEquipment[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [transportAssignments, setTransportAssignments] = useState<TransportAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: t } = await supabase.from('trips').select('*').eq('id', tripId).single()
      if (!t) {
        setLoading(false)
        return
      }
      setTrip(t)

      const [{ data: r }, { data: o }, { data: p }, { data: e }, { data: v }, { data: ta }] = await Promise.all([
        supabase.from('routes').select('*').eq('id', t.route_id).single(),
        supabase.from('profiles').select('*').eq('id', t.organizer_id).single(),
        supabase.from('trip_participants').select('*').eq('trip_id', tripId),
        supabase.from('trip_equipment_requirements').select('*').eq('trip_id', tripId),
        supabase.from('vehicles').select('*').eq('trip_id', tripId),
        supabase.from('transport_assignments').select('*'),
      ])

      setRoute(r)
      setOrganizer(o)
      setParticipants(p || [])
      setEquipment(e || [])
      setVehicles(v || [])
      setTransportAssignments(ta || [])

      // Fetch participant profiles
      if (p && p.length > 0) {
        const profileIds = p.map((tp) => tp.profile_id)
        const { data: profs } = await supabase.from('profiles').select('*').in('id', profileIds)
        const profMap: Record<string, Profile> = {}
        profs?.forEach((prof) => { profMap[prof.id] = prof })
        setParticipantProfiles(profMap)
      }

      // Fetch participant equipment
      if (p && p.length > 0 && e && e.length > 0) {
        const participantIds = p.map((tp) => tp.id)
        const { data: pe } = await supabase.from('participant_equipment').select('*').in('participant_id', participantIds)
        setParticipantEquipment(pe || [])
      }

      setLoading(false)
    }
    fetchData()
  }, [tripId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Salida no encontrada</p>
        <Button asChild variant="link">
          <Link to="/trips">Volver a salidas</Link>
        </Button>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Borrador', className: 'bg-muted text-muted-foreground' },
    open: { label: 'Abierta', className: 'bg-primary/10 text-primary' },
    closed: { label: 'Cerrada', className: 'bg-secondary/20 text-secondary' },
    completed: { label: 'Completada', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
  }

  const regStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-muted-foreground" />
      default: return <HelpCircle className="h-4 w-4 text-amber-500" />
    }
  }

  const assignedParticipantIds = new Set(
    transportAssignments
      .filter((a) => vehicles.some((v) => v.id === a.vehicle_id))
      .map((a) => a.participant_id)
  )

  const isOrganizer = user?.profile?.role === 'organizer' || user?.profile?.role === 'expedition_lead'
  const isTripOrganizer = user?.id === trip.organizer_id
  const canManage = isOrganizer || isTripOrganizer

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/trips">
          <ArrowLeft className="h-4 w-4" /> Volver a salidas
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">{trip.title}</h1>
            <Badge className={`${statusConfig[trip.status].className} border-0 capitalize`}>
              {statusConfig[trip.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {route?.name} · Organiza {organizer?.display_name}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="outline" asChild>
              <Link to="/trips/$tripId/edit" params={{ tripId }}>Editar</Link>
            </Button>
          )}
          {trip.status === 'open' && (
            <Button asChild>
              <Link to="/trips/$tripId/register" params={{ tripId }}>Inscribirme</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold">{new Date(trip.start_date).toLocaleDateString('es-CO')}</p>
              <p className="text-xs text-muted-foreground">Inicio</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-sm font-bold capitalize">{trip.pace}</p>
              <p className="text-xs text-muted-foreground">Ritmo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-bold">{participants.length}/{trip.max_participants ?? '∞'}</p>
              <p className="text-xs text-muted-foreground">Inscritos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Car className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold">{vehicles.length}</p>
              <p className="text-xs text-muted-foreground">Vehículos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="equipment">Equipo</TabsTrigger>
          <TabsTrigger value="transport">Transporte</TabsTrigger>
          <TabsTrigger value="route">Ruta</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lista de participantes ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participants.map((p) => {
                const profile = participantProfiles[p.profile_id]
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback>{profile?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{profile?.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.needs_transport ? 'Necesita transporte' : 'Con transporte propio'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignedParticipantIds.has(p.id) && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Car className="h-3 w-3" /> Asignado
                        </Badge>
                      )}
                      {regStatusIcon(p.status)}
                      <span className="text-xs capitalize text-muted-foreground">{p.status}</span>
                    </div>
                  </div>
                )
              })}
              {participants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin participantes aún</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Requisitos de equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {equipment.map((eq) => {
                const ownedCount = participantEquipment.filter(
                  (pe) => pe.equipment_id === eq.id && pe.status === 'owned'
                ).length
                return (
                  <div key={eq.id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{eq.item_name}</span>
                      {eq.mandatory && (
                        <Badge variant="destructive" className="text-[10px]">Obligatorio</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ownedCount} tienen · {participants.length - ownedCount} faltan
                    </span>
                  </div>
                )
              })}
              {equipment.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin requisitos de equipo</p>
              )}
            </CardContent>
          </Card>

          {equipment.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Mi checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center gap-3 p-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{eq.item_name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transport" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehículos ({vehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehicles.map((v) => {
                const owner = participantProfiles[v.owner_id]
                const assignments = transportAssignments.filter((a) => a.vehicle_id === v.id)
                const assignedProfiles = assignments.map((a) => {
                  const tp = participants.find((p) => p.id === a.participant_id)
                  return tp ? participantProfiles[tp.profile_id] : null
                }).filter(Boolean)

                return (
                  <div key={v.id} className="rounded-lg border border-border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{v.model ?? 'Vehículo sin modelo'}</p>
                        <p className="text-xs text-muted-foreground">
                          {owner?.display_name} · {v.capacity} cupos
                        </p>
                      </div>
                      <Badge variant={v.is_confirmed ? 'default' : 'secondary'}>
                        {v.is_confirmed ? 'Confirmado' : 'Pendiente'}
                      </Badge>
                    </div>
                    {v.tags && v.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {v.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-1">
                      {Array.from({ length: v.capacity }).map((_, i) => {
                        const passenger = assignedProfiles[i]
                        return (
                          <div
                            key={i}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                              passenger
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            title={passenger?.display_name ?? 'Libre'}
                          >
                            {passenger ? passenger.display_name?.[0] : ''}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {vehicles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin vehículos registrados</p>
              )}
            </CardContent>
          </Card>
          {canManage && (
            <Button asChild>
              <Link to="/trips/$tripId/transport" params={{ tripId }}>
                <Car className="mr-2 h-4 w-4" />
                Gestionar transporte
              </Link>
            </Button>
          )}
        </TabsContent>

        <TabsContent value="route" className="space-y-4">
          {route ? (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{route.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{route.description}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <TrendingUp className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-lg font-bold">{(route.gpx_parsed as any)?.distance ?? 0} km</p>
                    <p className="text-xs text-muted-foreground">Distancia</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Layers className="mx-auto h-5 w-5 text-secondary" />
                    <p className="mt-1 text-lg font-bold">{(route.gpx_parsed as any)?.elevation_gain ?? 0} m</p>
                    <p className="text-xs text-muted-foreground">Desnivel</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <MapPin className="mx-auto h-5 w-5 text-accent" />
                    <p className="mt-1 text-lg font-bold">{trip.meeting_point ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Encuentro</p>
                  </div>
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/routes/$routeId" params={{ routeId: route.id }}>Ver ruta completa</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">Ruta no encontrada</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
