import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { supabase } from '#/lib/supabase'
import { useIsOrganizer } from './_app'
import { Map, Search, Plus, ArrowRight, TrendingUp, Layers, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Tables } from '#/types/database.types'

type Route = Tables<'routes'>
type RouteWaypoint = Tables<'route_waypoints'>
type RouteSkill = Tables<'route_skill_requirements'>
type Profile = Tables<'profiles'>

export const Route = createFileRoute('/_app/routes')({
  component: RoutesListPage,
})

function RoutesListPage() {
  const [search, setSearch] = useState('')
  const [routes, setRoutes] = useState<Route[]>([])
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([])
  const [skills, setSkills] = useState<RouteSkill[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const isOrganizer = useIsOrganizer()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [{ data: r }, { data: w }, { data: s }, { data: p }] = await Promise.all([
        supabase.from('routes').select('*').order('created_at', { ascending: false }),
        supabase.from('route_waypoints').select('*'),
        supabase.from('route_skill_requirements').select('*'),
        supabase.from('profiles').select('id, display_name'),
      ])
      setRoutes(r || [])
      setWaypoints(w || [])
      setSkills(s || [])
      setProfiles(p || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = routes.filter((route) =>
    route.name.toLowerCase().includes(search.toLowerCase()) ||
    (route.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rutas</h1>
          <p className="text-muted-foreground">Explora y gestiona rutas de montaña</p>
        </div>
        {isOrganizer && (
          <Button asChild>
            <Link to="/routes/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva ruta
            </Link>
          </Button>
        )}
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
          const routeWaypoints = waypoints.filter((w) => w.route_id === route.id)
          const routeSkills = skills.filter((s) => s.route_id === route.id)
          const creator = profiles.find((p) => p.id === route.created_by)
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
                    {(route.gpx_parsed as any)?.distance ?? 0} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {(route.gpx_parsed as any)?.elevation_gain ?? 0} m+
                  </span>
                </div>

                {routeSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {routeSkills.slice(0, 3).map((s) => (
                      <Badge key={s.id} variant="secondary" className="text-xs">
                        {s.skill_tag}
                      </Badge>
                    ))}
                    {routeSkills.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{routeSkills.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {routeWaypoints.length} waypoints · Por {creator?.display_name ?? 'Anónimo'}
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
