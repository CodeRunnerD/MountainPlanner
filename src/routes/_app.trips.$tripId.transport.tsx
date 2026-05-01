import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  mockTrips,
  mockProfiles,
  mockTripParticipants,
  mockVehicles,
  mockTransportAssignments,
} from '#/lib/mock-data'
import { ArrowLeft, Car, MapPin, Users, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/_app/trips/$tripId/transport')({
  component: TransportPage,
})

function TransportPage() {
  const { tripId } = Route.useParams()
  const trip = mockTrips.find((t) => t.id === tripId)
  const vehicles = mockVehicles.filter((v) => v.trip_id === tripId)
  const participants = mockTripParticipants.filter((p) => p.trip_id === tripId && p.status === 'confirmed')
  const assignedIds = new Set(mockTransportAssignments.map((a) => a.participant_id))
  const unassigned = participants.filter((p) => !assignedIds.has(p.id))

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Salida no encontrada</p>
        <Button asChild variant="link">
          <Link to="/trips">Volver</Link>
        </Button>
      </div>
    )
  }

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
            const owner = mockProfiles.find((p) => p.id === v.owner_id)
            const assignments = mockTransportAssignments.filter((a) => a.vehicle_id === v.id)
            const seats = Array.from({ length: v.capacity }).map((_, i) => {
              const assignment = assignments[i]
              if (!assignment) return null
              const tp = mockTripParticipants.find((p) => p.id === assignment.participant_id)
              return mockProfiles.find((p) => p.id === tp?.profile_id)
            })
            return (
              <Card key={v.id} className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{v.model ?? 'Vehículo'}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {owner?.display_name} · {v.capacity} cupos
                      </p>
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
                        {passenger ? passenger.display_name[0] : ''}
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
          <Button variant="outline" className="w-full">+ Registrar vehículo</Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Sin asignar ({unassigned.length})</h2>
          <Card className="border-border shadow-sm">
            <CardContent className="space-y-2 p-4">
              {unassigned.map((p) => {
                const profile = mockProfiles.find((pr) => pr.id === p.profile_id)
                return (
                  <div key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-xs">{profile?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">{profile?.display_name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
