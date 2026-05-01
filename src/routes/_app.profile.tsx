import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { mockProfiles, mockMedicalInfo, mockSummitLogs, mockTrips, mockRoutes } from '#/lib/mock-data'
import { User, Heart, MapPin, Trophy, Calendar, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const profile = mockProfiles[0]
  const medical = mockMedicalInfo.find((m) => m.profile_id === profile.id)
  const logs = mockSummitLogs.filter((l) => l.profile_id === profile.id)

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
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">{profile.display_name[0]}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold text-foreground">{profile.display_name}</h2>
            <Badge variant="secondary" className="mt-1 capitalize">{profile.role}</Badge>
            <div className="mt-4 w-full space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profile.neighborhood ?? 'Sin ubicación'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {profile.phone ?? 'Sin teléfono'}
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full">Editar perfil</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
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
                const trip = mockTrips.find((t) => t.id === log.trip_id)
                const route = mockRoutes.find((r) => r.id === log.route_id)
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
        </div>
      </div>
    </div>
  )
}
