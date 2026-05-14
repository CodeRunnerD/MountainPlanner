import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { ArrowLeft, Car, MapPin, Users, ChevronRight, Loader2, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type Profile = Tables<'profiles'>
type TripParticipant = Tables<'trip_participants'>
type Vehicle = Tables<'vehicles'>
type TransportAssignment = Tables<'transport_assignments'>

export const Route = createFileRoute('/_app/trips/$tripId/transport')({
  component: TransportPage,
})

function TransportPage() {
  const { user } = useAuth()
  const { tripId } = Route.useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [participants, setParticipants] = useState<TripParticipant[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [transportAssignments, setTransportAssignments] = useState<TransportAssignment[]>([])
  const [loading, setLoading] = useState(true)

  // Vehicle registration form
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const vehicleForm = useForm({
    defaultValues: {
      model: '',
      capacity: '4',
      tags: '',
    },
    onSubmit: async ({ value }) => {
      if (!user?.profile?.id) return
      const { error } = await supabase.from('vehicles').insert({
        trip_id: tripId,
        owner_id: user.profile.id,
        model: value.model.trim(),
        capacity: parseInt(value.capacity, 10) || 4,
        tags: value.tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_confirmed: true,
      })
      if (error) {
        alert('Error al registrar vehículo: ' + error.message)
        return
      }
      setShowVehicleForm(false)
      vehicleForm.reset()
      loadData()
    },
  })

  // Assignment state
  const [assigningParticipantId, setAssigningParticipantId] = useState<string | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  const isOrganizer = user?.profile?.id === trip?.organizer_id

  const loadData = async () => {
    setLoading(true)
    const { data: t } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (!t) { setLoading(false); return }
    setTrip(t)

    const [{ data: v }, { data: p }, { data: ta }] = await Promise.all([
      supabase.from('vehicles').select('*').eq('trip_id', tripId),
      supabase.from('trip_participants').select('*').eq('trip_id', tripId).eq('status', 'confirmed'),
      supabase.from('transport_assignments').select('*'),
    ])

    setVehicles(v || [])
    setParticipants(p || [])
    setTransportAssignments(ta || [])

    if (p && p.length > 0) {
      const profileIds = p.map((tp) => tp.profile_id)
      const { data: profs } = await supabase.from('profiles').select('*').in('id', profileIds)
      const profMap: Record<string, Profile> = {}
      profs?.forEach((pr) => { profMap[pr.id] = pr })
      setProfiles(profMap)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [tripId])

  const handleAssign = async (participantId: string) => {
    if (!selectedVehicleId) return
    const { error } = await supabase.from('transport_assignments').insert({
      vehicle_id: selectedVehicleId,
      participant_id: participantId,
      assigned_by: user?.profile?.id,
    })
    if (error) {
      alert('Error al asignar: ' + error.message)
      return
    }
    setAssigningParticipantId(null)
    setSelectedVehicleId('')
    loadData()
  }

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
        <Button asChild variant="link"><Link to="/trips">Volver</Link></Button>
      </div>
    )
  }

  const assignedIds = new Set(transportAssignments.map((a) => a.participant_id))
  const unassigned = participants.filter((p) => !assignedIds.has(p.id))

  const vehicleCapacities = new Map<string, number>()
  vehicles.forEach((v) => {
    const assignedCount = transportAssignments.filter((a) => a.vehicle_id === v.id).length
    vehicleCapacities.set(v.id, v.capacity - assignedCount)
  })
  const availableVehicles = vehicles.filter((v) => (vehicleCapacities.get(v.id) ?? 0) > 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/trips/$tripId" params={{ tripId }}>
          <ArrowLeft className="h-4 w-4" /> Volver a la salida
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Transporte</h1>
        <p className="text-muted-foreground">{trip.title}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Car className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold">{vehicles.length}</p>
              <p className="text-xs text-muted-foreground">Vehículos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-accent" />
            <div>
              <p className="text-lg font-bold">{participants.length}</p>
              <p className="text-xs text-muted-foreground">Confirmados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-lg font-bold">{unassigned.length}</p>
              <p className="text-xs text-muted-foreground">Sin asignar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Vehículos</h2>
          {vehicles.map((v) => {
            const owner = profiles[v.owner_id]
            const assignments = transportAssignments.filter((a) => a.vehicle_id === v.id)
            const seats = Array.from({ length: v.capacity }).map((_, i) => {
              const assignment = assignments[i]
              if (!assignment) return null
              const tp = participants.find((p) => p.id === assignment.participant_id)
              return tp ? profiles[tp.profile_id] : null
            })
            return (
              <Card key={v.id} className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{v.model ?? 'Vehículo'}</CardTitle>
                      <p className="text-xs text-muted-foreground">{owner?.display_name} · {v.capacity} cupos</p>
                    </div>
                    <Badge variant={v.is_confirmed ? 'default' : 'secondary'}>
                      {v.is_confirmed ? 'Confirmado' : 'Pendiente'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {seats.map((passenger, i) => (
                      <div
                        key={i}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                          passenger
                            ? 'bg-primary text-primary-foreground'
                            : 'border-2 border-dashed border-border text-muted-foreground'
                        }`}
                        title={passenger?.display_name ?? 'Libre'}
                      >
                        {passenger ? passenger.display_name?.[0] : ''}
                      </div>
                    ))}
                  </div>
                  {v.tags && v.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {v.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {isOrganizer && (
            <>
              {!showVehicleForm ? (
                <Button variant="outline" className="w-full" onClick={() => setShowVehicleForm(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Registrar vehículo
                </Button>
              ) : (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Registrar vehículo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        vehicleForm.handleSubmit()
                      }}
                    >
                      <div className="space-y-3">
                        <vehicleForm.Field
                          name="model"
                          validators={{
                            onSubmit: ({ value }) => (!value.trim() ? 'El modelo es requerido' : undefined),
                          }}
                          children={(field) => (
                            <div className="space-y-2">
                              <Label htmlFor={field.name}>Modelo</Label>
                              <Input
                                id={field.name}
                                name={field.name}
                                placeholder="Ej: Toyota Hilux 2020"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                              />
                            </div>
                          )}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <vehicleForm.Field
                            name="capacity"
                            children={(field) => (
                              <div className="space-y-2">
                                <Label htmlFor={field.name}>Cupos</Label>
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  type="number"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                />
                              </div>
                            )}
                          />
                          <vehicleForm.Field
                            name="tags"
                            children={(field) => (
                              <div className="space-y-2">
                                <Label htmlFor={field.name}>Etiquetas (separadas por coma)</Label>
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  placeholder="4x4, Aire acondicionado"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" type="button" onClick={() => setShowVehicleForm(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <vehicleForm.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                              <Button size="sm" type="submit" disabled={!canSubmit || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                              </Button>
                            )}
                          />
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sin asignar ({unassigned.length})</h2>
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-2 p-4">
              {unassigned.map((p) => {
                const profile = profiles[p.profile_id]
                const isAssigning = assigningParticipantId === p.id
                return (
                  <div key={p.id}>
                    <div
                      className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => isOrganizer && !isAssigning && setAssigningParticipantId(p.id)}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{profile?.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">{profile?.display_name}</span>
                      {isOrganizer && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {isAssigning && (
                      <div className="mt-1 flex gap-2 px-2">
                        <select
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                        >
                          <option value="">Seleccionar vehículo...</option>
                          {availableVehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.model} ({vehicleCapacities.get(v.id)} libres)
                            </option>
                          ))}
                        </select>
                        <Button size="sm" onClick={() => handleAssign(p.id)} disabled={!selectedVehicleId}>
                          Asignar
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
              {unassigned.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Todos asignados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
