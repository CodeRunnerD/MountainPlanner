import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { supabase } from '#/lib/supabase'
import { getUserWithProfile } from '#/lib/session.functions'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>

export const Route = createFileRoute('/_app/trips/$tripId/edit')({
  beforeLoad: async () => {
    const data = await getUserWithProfile()
    const role = data?.profile?.role
    if (role !== 'organizer' && role !== 'expedition_lead') {
      throw redirect({ to: '/trips' })
    }
  },
  component: EditTripPage,
})

function EditTripPage() {
  const navigate = useNavigate()
  const { tripId } = Route.useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm({
    defaultValues: {
      title: '',
      meetingPoint: '',
      startDate: '',
      endDate: '',
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
          start_date: new Date(value.startDate).toISOString(),
          end_date: value.endDate ? new Date(value.endDate).toISOString() : null,
          pace: value.pace as any,
          max_participants: value.maxParticipants ? parseInt(value.maxParticipants, 10) : null,
          status: value.status as any,
        })
        .eq('id', tripId)

      if (error) {
        alert('Error al guardar: ' + error.message)
        return
      }
      navigate({ to: '/trips/$tripId', params: { tripId } })
    },
  })

  useEffect(() => {
    const fetchTrip = async () => {
      const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
      if (data) {
        setTrip(data)
        form.reset({
          title: data.title,
          meetingPoint: data.meeting_point ?? '',
          startDate: data.start_date.slice(0, 16),
          endDate: data.end_date?.slice(0, 16) ?? '',
          pace: data.pace,
          maxParticipants: data.max_participants?.toString() ?? '',
          status: data.status,
        })
      }
      setLoading(false)
    }
    fetchTrip()
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
        <Button asChild variant="link"><Link to="/trips">Volver</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
