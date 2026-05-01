import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { mockRoutes, mockRouteWaypoints, mockRouteSkills, mockProfiles } from '#/lib/mock-data'
import { Map, Search, Plus, ArrowRight, TrendingUp, Layers } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/routes')({
  component: RoutesListPage,
})

function RoutesListPage() {
  const [search, setSearch] = useState('')

  const filtered = mockRoutes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rutas</h1>
          <p className="text-muted-foreground">Explora y gestiona rutas de montaña</p>
        </div>
        <Button asChild>
          <Link to="/routes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva ruta
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar rutas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((route) => {
          const waypoints = mockRouteWaypoints.filter((w) => w.route_id === route.id)
          const skills = mockRouteSkills.filter((s) => s.route_id === route.id)
          const creator = mockProfiles.find((p) => p.id === route.created_by)
          return (
            <Card key={route.id} className="border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold leading-tight">{route.name}</CardTitle>
                  <Map className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{route.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {route.gpx_parsed?.distance ?? 0} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {route.gpx_parsed?.elevation_gain ?? 0} m+
                  </span>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 3).map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {s.skill_tag}
                      </Badge>
                    ))}
                    {skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{skills.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {waypoints.length} waypoints · Por {creator?.display_name ?? 'Anónimo'}
                  </span>
                  <Button size="sm" variant="ghost" asChild className="gap-1">
                    <Link to="/routes/$routeId" params={{ routeId: route.id }}>
                      Ver <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
