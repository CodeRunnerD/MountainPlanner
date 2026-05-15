import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Badge } from '#/components/ui/badge'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { getUserWithProfile } from '#/lib/session.functions'
import { requireApprovedOrganizer } from '#/lib/route-guards'
import { ArrowLeft, ChevronRight, Plus, X, Map, Calendar, Wrench, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Tables } from '#/types/database.types'

type Route = Tables<'routes'>

export const Route = createFileRoute('/_app/trips/new')({
  beforeLoad: async () => {
    const data = await getUserWithProfile()
    requireApprovedOrganizer(data?.profile)
  },
  component: NewTripPage,
})

function NewTripPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')

  const form = useForm({
    defaultValues: {
      routeId: '',
      title: '',
      startDate: '',
      endDate: '',
      meetingPoint: '',
      meetingLat: '',
      meetingLng: '',
      story: '',
      coverImage: '',
      pace: 'medium',
      maxParticipants: '',
      equipment: [] as string[],
    },
    onSubmit: async ({ value }) => {
      if (!value.routeId || !user?.id) return
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          route_id: value.routeId,
          organizer_id: user.id,
          title: value.title.trim(),
          meeting_point: value.meetingPoint.trim() || null,
          meeting_lat: value.meetingLat ? parseFloat(value.meetingLat) : null,
          meeting_lng: value.meetingLng ? parseFloat(value.meetingLng) : null,
          start_date: new Date(value.startDate).toISOString(),
          end_date: value.endDate ? new Date(value.endDate).toISOString() : null,
          pace: value.pace as any,
          max_participants: value.maxParticipants ? parseInt(value.maxParticipants, 10) : null,
          status: 'draft',
          story: value.story.trim() || null,
          cover_image: value.coverImage.trim() || null,
        })
        .select()
        .single()

      if (error || !trip) {
        alert('Error al crear la salida: ' + (error?.message ?? 'Desconocido'))
        return
      }

      if (value.equipment.length > 0) {
        await supabase.from('trip_equipment_requirements').insert(
          value.equipment.map((item) => ({
            trip_id: trip.id,
            item_name: item,
            mandatory: false,
          }))
        )
      }

      navigate({ to: '/trips/$tripId', params: { tripId: trip.id } })
    },
  })

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data } = await supabase.from('routes').select('*').order('name')
      setRoutes(data || [])
      setLoading(false)
    }
    fetchRoutes()
  }, [])

  useEffect(() => {
    const routeId = form.getFieldValue('routeId')
    if (routeId) {
      const r = routes.find((rt) => rt.id === routeId)
      if (r?.cover_image) {
        form.setFieldValue('coverImage', r.cover_image)
      }
    }
  }, [form.getFieldValue('routeId'), routes])

  const addEquipment = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    const current = form.getFieldValue('equipment') || []
    if (!current.includes(trimmed)) {
      form.setFieldValue('equipment', [...current, trimmed])
    }
    setNewItem('')
  }

  const removeEquipment = (item: string) => {
    const current = form.getFieldValue('equipment') || []
    form.setFieldValue('equipment', current.filter((i) => i !== item))
  }

  const canGoToStep2 = form.getFieldValue('routeId') !== ''
  const canGoToStep3 = form.getFieldValue('title').trim() !== '' && form.getFieldValue('startDate') !== ''

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/trips">
          <ArrowLeft className="h-4 w-4" /> Volver a salidas
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva salida</h1>
        <p className="text-muted-foreground">Crea una nueva excursión paso a paso</p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            <span
              className={`text-sm ${s === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
            >
              {s === 1 ? 'Ruta' : s === 2 ? 'Fecha' : 'Equipo'}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        {step === 1 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Paso 1: Selecciona la ruta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="routeId"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Ruta</Label>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Elige una ruta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} ({(r.gpx_parsed as any)?.distance ?? 0} km)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              {form.getFieldValue('routeId') && (
                <div className="rounded-lg bg-muted/50 p-4">
                  {(() => {
                    const r = routes.find((rt) => rt.id === form.getFieldValue('routeId'))
                    return r ? (
                      <div className="space-y-1">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {(r.gpx_parsed as any)?.distance} km · {(r.gpx_parsed as any)?.elevation_gain} m+
                        </p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)} disabled={!canGoToStep2}>
                  Continuar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Paso 2: Detalles de la salida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="title"
                validators={{
                  onSubmit: ({ value }) => (!value.trim() ? 'El título es requerido' : undefined),
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Título de la salida</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Ej: Ascenso Tolima — Enero 2026"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="startDate"
                  validators={{
                    onSubmit: ({ value }) => (!value ? 'La fecha de inicio es requerida' : undefined),
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Fecha y hora de inicio</Label>
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
                      <Label htmlFor={field.name}>Fecha y hora de regreso</Label>
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
              <form.Field
                name="meetingPoint"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Punto de encuentro</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Dirección o lugar"
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
                        placeholder="Ej: 4.65"
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
                        placeholder="Ej: -74.05"
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
                        placeholder="Ej: 8"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                <Button type="button" onClick={() => setStep(3)} disabled={!canGoToStep3}>
                  Continuar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Paso 3: Equipo requerido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Crampones, Casco..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                />
                <Button type="button" variant="secondary" onClick={addEquipment}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.getFieldValue('equipment')?.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => removeEquipment(item)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Atrás</Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear salida
                    </Button>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
