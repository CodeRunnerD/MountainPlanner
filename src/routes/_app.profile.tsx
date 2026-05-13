import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { User, Heart, MapPin, Trophy, TrendingUp, Loader2, Save, X } from 'lucide-react'
import type { Tables } from '#/types/database.types'

type MedicalInfo = Tables<'medical_info'>
type SummitLog = Tables<'summit_log'>
type Route = Tables<'routes'>
type Trip = Tables<'trips'>

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const profile = user?.profile
  const profileId = profile?.id

  const [medical, setMedical] = useState<MedicalInfo | null>(null)
  const [logs, setLogs] = useState<SummitLog[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const form = useForm({
    defaultValues: {
      displayName: '',
      phone: '',
      neighborhood: '',
      bloodType: '',
      allergies: '',
      medications: '',
      medicalNotes: '',
    },
    onSubmit: async ({ value }) => {
      if (!profileId) return

      await supabase.from('profiles').update({
        display_name: value.displayName.trim(),
        phone: value.phone.trim() || null,
        neighborhood: value.neighborhood.trim() || null,
      }).eq('id', profileId)

      await supabase.from('medical_info').upsert({
        profile_id: profileId,
        blood_type: value.bloodType as any,
        allergies: value.allergies.split(',').map((a) => a.trim()).filter(Boolean),
        medications: value.medications.trim() || null,
        notes: value.medicalNotes.trim() || null,
      })

      const { data: m } = await supabase.from('medical_info').select('*').eq('profile_id', profileId).single()
      setMedical(m)
      await refreshProfile()
      setEditing(false)
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!profileId) { setLoading(false); return }
      setLoading(true)
      const [{ data: m }, { data: l }, { data: r }, { data: t }] = await Promise.all([
        supabase.from('medical_info').select('*').eq('profile_id', profileId).single(),
        supabase.from('summit_log').select('*').eq('profile_id', profileId),
        supabase.from('routes').select('*'),
        supabase.from('trips').select('*'),
      ])
      setMedical(m)
      setLogs(l || [])
      setRoutes(r || [])
      setTrips(t || [])
      setLoading(false)
    }
    fetchData()
  }, [profileId])

  const startEditing = () => {
    form.reset({
      displayName: profile?.display_name ?? '',
      phone: profile?.phone ?? '',
      neighborhood: profile?.neighborhood ?? '',
      bloodType: medical?.blood_type ?? '',
      allergies: medical?.allergies?.join(', ') ?? '',
      medications: medical?.medications ?? '',
      medicalNotes: medical?.notes ?? '',
    })
    setEditing(true)
  }

  const displayName = profile?.display_name || user?.email || 'Usuario'
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
  const role = profile?.role || 'participant'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground">Tu información personal y médica</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-sm lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl">{displayName[0]}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold text-foreground">{displayName}</h2>
            <Badge variant="secondary" className="mt-1 capitalize">{role}</Badge>
            <div className="mt-4 w-full space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profile?.neighborhood ?? 'Sin ubicación'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {profile?.phone ?? 'Sin teléfono'}
              </div>
            </div>
            {!editing && (
              <Button variant="outline" className="mt-4 w-full" onClick={startEditing}>Editar perfil</Button>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
            >
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Editar perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form.Field
                    name="displayName"
                    validators={{
                      onSubmit: ({ value }) => (!value.trim() ? 'El nombre es requerido' : undefined),
                    }}
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Nombre</Label>
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field
                      name="phone"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Teléfono</Label>
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
                    <form.Field
                      name="neighborhood"
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor={field.name}>Barrio / Ciudad</Label>
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
                  </div>
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
                        <Label htmlFor={field.name}>Alergias (separadas por coma)</Label>
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
                  <form.Field
                    name="medications"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Medicamentos</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
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
                        <Label htmlFor={field.name}>Notas médicas</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          rows={2}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setEditing(false)}>
                      <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <form.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}
                      children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" disabled={!canSubmit || isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </form>
          ) : (
            <>
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-destructive" />
                    Información médica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {medical ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de sangre</p>
                        <p className="font-medium">{medical.blood_type ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Alergias</p>
                        <p className="font-medium">{medical.allergies?.join(', ') ?? 'Ninguna'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Medicamentos</p>
                        <p className="font-medium">{medical.medications ?? '—'}</p>
                      </div>
                      {medical.notes && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-muted-foreground">Notas</p>
                          <p className="font-medium">{medical.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No has registrado información médica</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Log de cumbres ({logs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logs.map((log) => {
                    const trip = trips.find((t) => t.id === log.trip_id)
                    const route = routes.find((r) => r.id === log.route_id)
                    return (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3">
                        <div>
                          <p className="font-medium text-sm">{route?.name ?? 'Cumbre'}</p>
                          <p className="text-xs text-muted-foreground">
                            {trip?.title} · {new Date(log.completed_at).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                    )
                  })}
                  {logs.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aún no tienes cumbres registradas</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
