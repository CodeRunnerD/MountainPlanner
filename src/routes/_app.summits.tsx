import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { Trophy, Calendar, TrendingUp, Layers, Loader2 } from 'lucide-react'
import type { Tables } from '#/types/database.types'

type SummitLog = Tables<'summit_log'>
type Route = Tables<'routes'>
type Trip = Tables<'trips'>

export const Route = createFileRoute('/_app/summits')({
  component: SummitsPage,
})

function SummitsPage() {
  const { user } = useAuth()
  const profileId = user?.profile?.id
  const [logs, setLogs] = useState<SummitLog[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!profileId) { setLoading(false); return }
      setLoading(true)
      const [{ data: l }, { data: r }, { data: t }] = await Promise.all([
        supabase.from('summit_log').select('*').eq('profile_id', profileId),
        supabase.from('routes').select('*'),
        supabase.from('trips').select('*'),
      ])
      setLogs(l || [])
      setRoutes(r || [])
      setTrips(t || [])
      setLoading(false)
    }
    fetchData()
  }, [profileId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cumbres</h1>
        <p className="text-muted-foreground">Tu historial de ascensos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 text-accent" />
            <div>
              <p className="text-lg font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Cumbres totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold">
                {logs.reduce((acc, l) => {
                  const route = routes.find((r) => r.id === l.route_id)
                  return acc + ((route?.gpx_parsed as any)?.elevation_gain ?? 0)
                }, 0)} m
              </p>
              <p className="text-xs text-muted-foreground">Desnivel acumulado</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Layers className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-lg font-bold">
                {logs.reduce((acc, l) => {
                  const route = routes.find((r) => r.id === l.route_id)
                  return acc + ((route?.gpx_parsed as any)?.distance ?? 0)
                }, 0)} km
              </p>
              <p className="text-xs text-muted-foreground">Distancia acumulada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {logs.map((log) => {
          const trip = trips.find((t) => t.id === log.trip_id)
          const route = routes.find((r) => r.id === log.route_id)
          return (
            <Card key={log.id} className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{route?.name ?? 'Cumbre'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{trip?.title}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(log.completed_at).toLocaleDateString('es-CO')}
                </div>
                {log.notes && (
                  <p className="text-sm italic text-muted-foreground">"{log.notes}"</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{(route?.gpx_parsed as any)?.distance ?? 0} km</span>
                  <span>{(route?.gpx_parsed as any)?.elevation_gain ?? 0} m+</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
