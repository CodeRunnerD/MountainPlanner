import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import {
  mockRoutes,
  mockRouteWaypoints,
  mockRouteSkills,
  mockProfiles,
  mockTrips,
} from '#/lib/mock-data'
import {
  Map,
  ArrowLeft,
  TrendingUp,
  Layers,
  Calendar,
  Mountain,
  Navigation,
  Flag,
  CircleDot,
  Star,
} from 'lucide-react'

export const Route = createFileRoute('/_app/routes/$routeId')({
  component: RouteDetailPage,
})

function RouteDetailPage() {
  const { routeId } = Route.useParams()
  const route = mockRoutes.find((r) => r.id === routeId)
  const waypoints = mockRouteWaypoints.filter((w) => w.route_id === routeId)
  const skills = mockRouteSkills.filter((s) => s.route_id === routeId)
  const creator = mockProfiles.find((p) => p.id === route?.created_by)
  const tripsUsing = mockTrips.filter((t) => t.route_id === routeId)

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ruta no encontrada</p>
        <Button asChild variant="link">
          <Link to="/routes">Volver a rutas</Link>
        </Button>
      </div>
    )
  }

  const getWaypointIcon = (type: string) => {
    switch (type) {
      case 'start': return <Navigation className="h-4 w-4 text-primary" />
      case 'summit': return <Star className="h-4 w-4 text-accent" />
      case 'end': return <Flag className="h-4 w-4 text-destructive" />
      default: return <CircleDot className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/routes">
          <ArrowLeft className="h-4 w-4" /> Volver a rutas
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{route.name}</h1>
          <p className="text-muted-foreground mt-1">{route.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/routes/$routeId/edit" params={{ routeId: route.id }}>Editar</Link>
          </Button>
          <Button asChild>
            <Link to="/trips/new" search={{ routeId: route.id }}>Crear salida</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{route.gpx_parsed?.distance ?? 0} km</p>
              <p className="text-xs text-muted-foreground">Distancia</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Layers className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-lg font-bold text-foreground">{route.gpx_parsed?.elevation_gain ?? 0} m</p>
              <p className="text-xs text-muted-foreground">Desnivel positivo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Mountain className="h-5 w-5 text-accent" />
            <div>
              <p className="text-lg font-bold text-foreground">
                {waypoints.find((w) => w.type === 'summit')?.elevation ?? '—'} m
              </p>
              <p className="text-xs text-muted-foreground">Cumbre</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Waypoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {waypoints.sort((a, b) => a.order_index - b.order_index).map((wp) => (
              <div
                key={wp.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3"
              >
                {getWaypointIcon(wp.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{wp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {wp.elevation ? `${wp.elevation} m` : '—'}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {wp.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Habilidades requeridas</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin requisitos técnicos</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.skill_tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado por</span>
                <span className="font-medium">{creator?.display_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span>{new Date(route.created_at).toLocaleDateString('es-CO')}</span>
              </div>
              {route.source_url && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fuente</span>
                  <a
                    href={route.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    Wikiloc
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {tripsUsing.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Salidas usando esta ruta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tripsUsing.map((trip) => (
                  <Link
                    key={trip.id}
                    to="/trips/$tripId"
                    params={{ tripId: trip.id }}
                    className="block rounded-md p-2 text-sm hover:bg-muted transition-colors"
                  >
                    {trip.title}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
