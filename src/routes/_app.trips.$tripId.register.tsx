import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Checkbox } from '#/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { ArrowLeft, Shield, Heart, Phone, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type Route = Tables<'routes'>

export const Route = createFileRoute('/_app/trips/$tripId/register')({
  component: TripRegistrationPage,
})

function TripRegistrationPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tripId } = Route.useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm({
    defaultValues: {
      needsTransport: false,
      phone: '',
      emergencyContact: '',
      bloodType: '',
      allergies: '',
      medications: '',
      medicalNotes: '',
      cedula: '',
      insurance: '',
    },
    onSubmit: async ({ value }) => {
      if (!user?.profile?.id) return
      const profileId = user.profile.id

      if (value.phone.trim()) {
        await supabase.from('profiles').update({ phone: value.phone.trim() }).eq('id', profileId)
      }

      await supabase.from('medical_info').upsert({
        profile_id: profileId,
        blood_type: value.bloodType as any,
        allergies: value.allergies.split(',').map((a) => a.trim()).filter(Boolean),
        medications: value.medications.trim() || null,
        notes: value.medicalNotes.trim() || null,
      })

      const { error: participantError } = await supabase.from('trip_participants').insert({
        trip_id: tripId,
        profile_id: profileId,
        needs_transport: value.needsTransport,
        status: 'pending',
      })

      if (participantError) {
        alert('Error al inscribirse: ' + participantError.message)
        return
      }

      if (value.cedula.trim() || value.emergencyContact.trim() || value.insurance.trim()) {
        await supabase.from('sensitive_data_vault').upsert({
          profile_id: profileId,
          trip_id: tripId,
          encrypted_cedula: value.cedula.trim() || null,
          encrypted_emergency_phone: value.emergencyContact.trim() || null,
          encrypted_insurance: value.insurance.trim() || null,
        })
      }

      navigate({ to: '/trips/$tripId', params: { tripId } })
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: t } = await supabase.from('trips').select('*').eq('id', tripId).single()
      if (!t) { setLoading(false); return }
      setTrip(t)
      const { data: r } = await supabase.from('routes').select('*').eq('id', t.route_id).single()
      setRoute(r)

      const phone = user?.profile?.phone ?? ''
      let med: Tables<'medical_info'> | null = null
      if (user?.profile?.id) {
        const { data: m } = await supabase.from('medical_info').select('*').eq('profile_id', user.profile.id).single()
        med = m
      }

      form.reset({
        needsTransport: false,
        phone,
        emergencyContact: '',
        bloodType: med?.blood_type ?? '',
        allergies: med?.allergies?.join(', ') ?? '',
        medications: med?.medications ?? '',
        medicalNotes: med?.notes ?? '',
        cedula: '',
        insurance: '',
      })

      setLoading(false)
    }
    fetchData()
  }, [tripId, user?.profile?.id, user?.profile?.phone])

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
        <h1 className="text-3xl font-bold text-foreground">Inscripción</h1>
        <p className="text-muted-foreground">{trip.title} · {route?.name}</p>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Información de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field
              name="phone"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Teléfono</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="+57 300 123 4567"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="emergencyContact"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Contacto de emergencia</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Nombre y teléfono"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="needsTransport"
              children={(field) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v === true)}
                  />
                  <Label htmlFor={field.name} className="text-sm font-normal">
                    Necesito transporte (no tengo vehículo)
                  </Label>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Información médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field
              name="bloodType"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Tipo de sangre</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <form.Field
              name="allergies"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Alergias</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Separadas por coma"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="medications"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Medicamentos actuales</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    placeholder="¿Tomas algún medicamento?"
                    rows={2}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="medicalNotes"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Notas médicas adicionales</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    placeholder="Cualquier otra información relevante..."
                    rows={2}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Datos sensibles (encriptados)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field
              name="cedula"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Cédula / Documento de identidad</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="1000000000"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="insurance"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Seguro (opcional)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Número de póliza"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Estos datos se almacenan encriptados y solo los organizadores pueden acceder a ellos en caso de emergencia.
            </p>
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
                Confirmar inscripción
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
