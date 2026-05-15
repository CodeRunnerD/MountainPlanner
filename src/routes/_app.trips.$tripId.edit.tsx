import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { supabase } from '#/lib/supabase'
import { getUserWithProfile } from '#/lib/session.functions'
import { requireApprovedOrganizer } from '#/lib/route-guards'
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type TripParticipant = Tables<'trip_participants'>
type Profile = Tables<'profiles'>
type EquipmentReq = Tables<'trip_equipment_requirements'>
type ParticipantEquipment = Tables<'participant_equipment'>

export const Route = createFileRoute('/_app/trips/$tripId/edit')({
  beforeLoad: async () => {
    const data = await getUserWithProfile()
    requireApprovedOrganizer(data?.profile)
  },
  component: EditTripPage,
})

function EditTripPage() {
  const navigate = useNavigate()
  const { tripId } = Route.useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<TripParticipant[]>([])
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, Profile>>({})
  const [equipment, setEquipment] = useState<EquipmentReq[]>([])
  const [participantEquipment, setParticipantEquipment] = useState<ParticipantEquipment[]>([])
  const [newEquipmentItem, setNewEquipmentItem] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      title: '',
      meetingPoint: '',
      meetingLat: '',
      meetingLng: '',
      startDate: '',
      endDate: '',
      story: '',
      coverImage: '',
      pace: 'medium',
      maxParticipants: '',
      status: 'draft',
    },
    onSubmit: async ({ value }) => {
      const { error } = await supabase
        .from('trips')
        .update({
          title: value.title.trim(),
          meeting_point: value.meetingPoint.trim() || null,
          meeting_lat: value.meetingLat ? parseFloat(value.meetingLat) : null,
          meeting_lng: value.meetingLng ? parseFloat(value.meetingLng) : null,
          start_date: new Date(value.startDate).toISOString(),
          end_date: value.endDate ? new Date(value.endDate).toISOString() : null,
          pace: value.pace as any,
          max_participants: value.maxParticipants ? parseInt(value.maxParticipants, 10) : null,
          status: value.status as any,
          story: value.story.trim() || null,
          cover_image: value.coverImage.trim() || null,
        })
        .eq('id', tripId)

      if (error) {
        alert('Error al guardar: ' + error.message)
        return
      }
      navigate({ to: '/trips/$tripId', params: { tripId } })
    },
  })

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    if (data) {
      setTrip(data)
      form.reset({
        title: data.title,
        meetingPoint: data.meeting_point ?? '',
        meetingLat: data.meeting_lat?.toString() ?? '',
        meetingLng: data.meeting_lng?.toString() ?? '',
        startDate: data.start_date.slice(0, 16),
        endDate: data.end_date?.slice(0, 16) ?? '',
        pace: data.pace,
        maxParticipants: data.max_participants?.toString() ?? '',
        status: data.status,
        story: data.story ?? '',
        coverImage: data.cover_image ?? '',
      })
    }

    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from('trip_participants').select('*').eq('trip_id', tripId),
      supabase.from('trip_equipment_requirements').select('*').eq('trip_id', tripId),
    ])

    setParticipants(p || [])
    setEquipment(e || [])

    if (p && p.length > 0) {
      const profileIds = p.map((tp) => tp.profile_id)
      const { data: profs } = await supabase.from('profiles').select('*').in('id', profileIds)
      const profMap: Record<string, Profile> = {}
      profs?.forEach((prof) => { profMap[prof.id] = prof })
      setParticipantProfiles(profMap)
    }

    if (p && p.length > 0 && e && e.length > 0) {
      const participantIds = p.map((tp) => tp.id)
      const { data: pe } = await supabase.from('participant_equipment').select('*').in('participant_id', participantIds)
      setParticipantEquipment(pe || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [tripId])

  const updateParticipantStatus = async (participantId: string, status: string) => {
    setActionLoading(participantId)
    const { error } = await supabase
      .from('trip_participants')
      .update({ status })
      .eq('id', participantId)
    if (error) {
      alert('Error al actualizar estado: ' + error.message)
    } else {
      setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, status: status as any } : p)))
    }
    setActionLoading(null)
  }

  const addEquipmentRequirement = async () => {
    const trimmed = newEquipmentItem.trim()
    if (!trimmed) return
    const { data, error } = await supabase
      .from('trip_equipment_requirements')
      .insert({ trip_id: tripId, item_name: trimmed, mandatory: false })
      .select()
      .single()
    if (error) {
      alert('Error al agregar equipo: ' + error.message)
      return
    }
    setEquipment((prev) => [...prev, data])
    setNewEquipmentItem('')
  }

  const removeEquipmentRequirement = async (eqId: string) => {
    const { error } = await supabase
      .from('trip_equipment_requirements')
      .delete()
      .eq('id', eqId)
    if (error) {
      alert('Error al eliminar equipo: ' + error.message)
      return
    }
    setEquipment((prev) => prev.filter((e) => e.id !== eqId))
    setParticipantEquipment((prev) => prev.filter((pe) => pe.equipment_id !== eqId))
  }

  const regStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-700 border-0">Confirmado</Badge>
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-0">Rechazado</Badge>
      case 'cancelled': return <Badge className="bg-muted text-muted-foreground border-0">Cancelado</Badge>
      default: return <Badge className="bg-amber-100 text-amber-700 border-0">Pendiente</Badge>
    }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/trips/$tripId" params={{ tripId }}>
          <ArrowLeft className="h-4 w-4" /> Volver a la salida
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar salida</h1>
        <p className="text-muted-foreground">{trip.title}</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="equipment">Equipo</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field
                  name="title"
                  validators={{
                    onSubmit: ({ value }) => (!value.trim() ? 'El título es requerido' : undefined),
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Título</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                />
                <form.Field
                  name="meetingPoint"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Punto de encuentro</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field
                    name="meetingLat"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Latitud de encuentro</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="any"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  />
                  <form.Field
                    name="meetingLng"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Longitud de encuentro</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="any"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  />
                </div>
                <form.Field
                  name="coverImage"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>URL de imagen de portada</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="https://example.com/image.jpg"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                />
                <form.Field
                  name="story"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Historia / Relato</Label>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder="Comparte la historia o experiencia de esta salida..."
                        rows={4}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field
                    name="startDate"
                    validators={{
                      onSubmit: ({ value }) => (!value ? 'La fecha de inicio es requerida' : undefined),
                    }}
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Inicio</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="datetime-local"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  />
                  <form.Field
                    name="endDate"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Regreso</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="datetime-local"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.Field
                    name="pace"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label>Ritmo</Label>
                        <Select value={field.state.value} onValueChange={field.handleChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Lento</SelectItem>
                            <SelectItem value="medium">Medio</SelectItem>
                            <SelectItem value="sport">Sport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                  <form.Field
                    name="maxParticipants"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Máximo participantes</Label>
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
                </div>
                <form.Field
                  name="status"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={field.state.value} onValueChange={field.handleChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="open">Abierta</SelectItem>
                          <SelectItem value="closed">Cerrada</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gestión de participantes</CardTitle>
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
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {regStatusBadge(p.status)}
                        {p.status !== 'cancelled' && (
                          <div className="flex gap-1">
                            {p.status !== 'confirmed' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={actionLoading === p.id}
                                onClick={() => updateParticipantStatus(p.id, 'confirmed')}
                              >
                                Confirmar
                              </Button>
                            )}
                            {p.status !== 'rejected' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={actionLoading === p.id}
                                onClick={() => updateParticipantStatus(p.id, 'rejected')}
                              >
                                Rechazar
                              </Button>
                            )}
                            {p.status !== 'cancelled' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={actionLoading === p.id}
                                onClick={() => updateParticipantStatus(p.id, 'cancelled')}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        )}
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
                <CardTitle className="text-lg">Requisitos de equipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: Crampones, Casco..."
                    value={newEquipmentItem}
                    onChange={(e) => setNewEquipmentItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipmentRequirement())}
                  />
                  <Button type="button" variant="secondary" onClick={addEquipmentRequirement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {equipment.map((eq) => {
                  const ownedCount = participantEquipment.filter(
                    (pe) => pe.equipment_id === eq.id && pe.status === 'owned'
                  ).length
                  const rentalCount = participantEquipment.filter(
                    (pe) => pe.equipment_id === eq.id && pe.status === 'needs_rental'
                  ).length
                  return (
                    <div key={eq.id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm text-foreground truncate">{eq.item_name}</span>
                        {eq.mandatory && (
                          <Badge variant="destructive" className="text-[10px]">Obligatorio</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {ownedCount} tienen · {rentalCount} alquilan
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeEquipmentRequirement(eq.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                })}
                {equipment.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin requisitos de equipo</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/trips/$tripId" params={{ tripId }}>Cancelar</Link>
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
