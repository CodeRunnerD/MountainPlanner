import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { ParallaxWrapper } from '#/components/parallax-hero'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import {
  Mountain,
  Calendar,
  MapPin,
  TrendingUp,
  Layers,
  ArrowRight,
  Compass,
  Users,
  Route as RouteIcon,
  Map,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Tables } from '#/types/database.types'

type Trip = Tables<'trips'>
type RouteItem = Tables<'routes'>
type Profile = Tables<'profiles'>

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: t }, { data: r }, { data: p }] = await Promise.all([
        supabase.from('trips').select('*').order('start_date', { ascending: false }),
        supabase.from('routes').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, display_name, avatar_url'),
      ])
      setTrips(t || [])
      setRoutes(r || [])
      setProfiles(p || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const completedTrips = trips.filter((t) =>
    ['completed', 'closed'].includes(t.status)
  )
  const upcomingTrips = trips.filter((t) =>
    ['open', 'draft'].includes(t.status)
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Mountain className="h-7 w-7 text-[#FDE68A]" />
            <span className="text-xl font-bold text-primary-foreground">MountainPlanner</span>
          </Link>
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
            ) : user ? (
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                asChild
              >
                <Link to="/dashboard">
                  <img
                    src={
                      user.profile?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                    }
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="hidden sm:inline">
                    {user.profile?.display_name || user.email}
                  </span>
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button className="bg-primary-foreground text-background hover:bg-primary-foreground/90" asChild>
                  <Link to="/register">Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <ParallaxWrapper>
        {/* Hero content — centered over the sticky parallax background */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
          <div className="relative" style={{ zIndex: 10 }}>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
              style={{ borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <Mountain className="h-4 w-4" style={{ color: '#FDE68A' }} />
              <span className="text-sm font-medium" style={{ color: '#fff' }}>
                Explora las montanas de Colombia
              </span>
            </div>

            <h1
              className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: '#fff' }}
            >
              Planifica tu proxima{' '}
              <span style={{ color: '#FDE68A' }}>cumbre</span>
            </h1>

            <p
              className="mx-auto mt-6 text-lg leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Descubre rutas documentadas, unete a expediciones con la comunidad y lleva tu bitacora de ascensos.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="shadow-lg"
                style={{ backgroundColor: '#fff', color: '#0C4A6E' }}
                asChild
              >
                <Link to="/register">Unirme a la comunidad</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-sm"
                style={{ borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff' }}
                asChild
              >
                <Link to="/login">Iniciar sesion</Link>
              </Button>
            </div>

            <div className="mt-20 grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-bold" style={{ color: '#fff' }}>20+</p>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Rutas</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: '#fff' }}>150+</p>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Expediciones</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: '#fff' }}>500+</p>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Montanistas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary-foreground/20 bg-card/80 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">Descubre rutas</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Explora rutas documentadas con waypoints, perfiles de elevación y requisitos técnicos.
                </p>
              </div>
              <div className="rounded-2xl border border-primary-foreground/20 bg-card/80 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">Únete a salidas</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Inscríbete en expediciones, gestiona tu equipo y coordina el transporte con el grupo.
                </p>
              </div>
              <div className="rounded-2xl border border-primary-foreground/20 bg-card/80 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Map className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">Registra cumbres</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Lleva tu bitácora de ascensos, comparte fotos y descarga tracks GPX de cada expedición.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expeditions */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Expediciones recientes</h2>
                <p className="mt-2 text-muted-foreground">
                  Historias, rutas y cumbres de nuestra comunidad
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {completedTrips.map((trip) => {
                const route = routes.find((r) => r.id === trip.route_id)
                const organizer = profiles.find((p) => p.id === trip.organizer_id)
                return (
                  <Link
                    key={trip.id}
                    to="/expeditions/$tripId"
                    params={{ tripId: trip.id }}
                    className="group block overflow-hidden rounded-2xl border border-primary-foreground/20 bg-card/90 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={trip.cover_image}
                        alt={trip.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-card/90 text-foreground hover:bg-primary-foreground">
                          {route?.name}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {trip.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {route?.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(trip.start_date).toLocaleDateString('es-CO', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {route?.gpx_parsed?.distance ?? 0} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {route?.gpx_parsed?.elevation_gain ?? 0} m
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                        <img
                          src={organizer?.avatar_url}
                          alt={organizer?.display_name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <span className="text-xs text-muted-foreground">
                          Por {organizer?.display_name}
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Upcoming trips */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-foreground">Próximas salidas</h2>
              <p className="mt-2 text-muted-foreground">
                Salidas abiertas a las que aún puedes unirte
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingTrips.map((trip) => {
                const route = routes.find((r) => r.id === trip.route_id)
                const organizer = profiles.find((p) => p.id === trip.organizer_id)
                return (
                  <Card key={trip.id} className="border-primary-foreground/20 bg-card/90 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{trip.title}</h3>
                          <p className="text-sm text-muted-foreground">{route?.name}</p>
                        </div>
                        <Badge variant={trip.status === 'open' ? 'default' : 'secondary'}>
                          {trip.status === 'open' ? 'Abierta' : 'Borrador'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(trip.start_date).toLocaleDateString('es-CO')}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {route?.gpx_parsed?.distance ?? 0} km
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {trip.meeting_point ?? 'Punto por definir'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={organizer?.avatar_url}
                            alt={organizer?.display_name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span className="text-xs text-muted-foreground">
                            {organizer?.display_name}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/trips/$tripId" params={{ tripId: trip.id }}>
                            Ver <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Featured routes */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-foreground">Rutas destacadas</h2>
              <p className="mt-2 text-muted-foreground">
                Rutas más populares de nuestra comunidad
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {routes.map((route) => {
                const creator = profiles.find((p) => p.id === route.created_by)
                return (
                  <Link
                    key={route.id}
                    to="/route-guides/$routeId"
                    params={{ routeId: route.id }}
                    className="group rounded-2xl border border-primary-foreground/20 bg-card/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <RouteIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {route.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {route.gpx_parsed?.distance ?? 0} km · {route.gpx_parsed?.elevation_gain ?? 0} m+
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                      {route.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <img
                        src={creator?.avatar_url}
                        alt={creator?.display_name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      <span className="text-xs text-muted-foreground">{creator?.display_name}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold text-primary">{routes.length}</p>
                <p className="text-sm text-muted-foreground">Rutas documentadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{completedTrips.length}</p>
                <p className="text-sm text-muted-foreground">Expediciones realizadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{profiles.length}</p>
                <p className="text-sm text-muted-foreground">Montañistas activos</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 lg:p-16">
              <div className="relative z-10 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="">
                  <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
                    ¿Listo para tu próxima aventura?
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-primary-foreground/90">
                    Regístrate gratis y descubre rutas, organiza salidas y conecta con otros amantes de la montaña.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                    <Link to="/register">Empezar ahora</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link to="/login">Iniciar sesión</Link>
                  </Button>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/10" />
              <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-primary-foreground/10" />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-background/80 py-10">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-[#FDE68A]" />
                <span className="font-bold text-primary-foreground">MountainPlanner</span>
              </div>
              <p className="text-sm text-primary-foreground/60">
                Hecho con pasión por la montaña · 2026
              </p>
            </div>
          </div>
        </footer>
      </ParallaxWrapper>
    </div>
  )
}
