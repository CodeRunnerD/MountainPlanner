import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '#/components/ui/dialog'
import { supabase } from '#/lib/supabase'
import { useState, useEffect } from 'react'
import {
  Mountain, ArrowLeft, ArrowRight, X, TrendingUp, Layers,
  Navigation, Star, Flag, CircleDot, Download, Map, Clock, Calendar, Gauge, Loader2,
} from 'lucide-react'
import type { Tables } from '#/types/database.types'

type Route = Tables<'routes'>
type Profile = Tables<'profiles'>
type RouteWaypoint = Tables<'route_waypoints'>
type RouteSkill = Tables<'route_skill_requirements'>
type Trip = Tables<'trips'>

const difficultyLabels: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Principiante', color: 'bg-green-100 text-green-700' },
  intermediate: { label: 'Intermedio', color: 'bg-amber-100 text-amber-700' },
  advanced: { label: 'Avanzado', color: 'bg-orange-100 text-orange-700' },
  expert: { label: 'Experto', color: 'bg-red-100 text-red-700' },
}

export const Route = createFileRoute('/route-guides/$routeId')({
  component: RouteGuidePage,
})

function RouteGuidePage() {
  const { routeId } = Route.useParams()
  const [route, setRoute] = useState<Route | null>(null)
  const [creator, setCreator] = useState<Profile | null>(null)
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([])
  const [skills, setSkills] = useState<RouteSkill[]>([])
  const [tripsUsing, setTripsUsing] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: r } = await supabase.from('routes').select('*').eq('id', routeId).single()
      if (!r) { setLoading(false); return }
      setRoute(r)
      const [{ data: c }, { data: w }, { data: s }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', r.created_by).single(),
        supabase.from('route_waypoints').select('*').eq('route_id', routeId),
        supabase.from('route_skill_requirements').select('*').eq('route_id', routeId),
        supabase.from('trips').select('id, title, start_date').eq('route_id', routeId),
      ])
      setCreator(c)
      setWaypoints(w || [])
      setSkills(s || [])
      setTripsUsing(t || [])
      setLoading(false)
    }
    fetchData()
  }, [routeId])

  const galleryImages = [
    route?.cover_image,
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=80',
    'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  ].filter(Boolean) as string[]

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true) }
  const nextImage = () => setLightboxIndex((i) => (i + 1) % galleryImages.length)
  const prevImage = () => setLightboxIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)

  const getWaypointIcon = (type: string) => {
    switch (type) {
      case 'start': return <Navigation className="h-4 w-4 text-primary" />
      case 'summit': return <Star className="h-4 w-4 text-accent" />
      case 'end': return <Flag className="h-4 w-4 text-destructive" />
      default: return <CircleDot className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Ruta no encontrada</p>
          <Button asChild variant="link" className="mt-2"><Link to="/">Volver al inicio</Link></Button>
        </div>
      </div>
    )
  }

  const storyParagraphs = route.story?.split('\n\n') ?? []
  const diff = route.difficulty ? difficultyLabels[route.difficulty] : null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">MountainPlanner</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-1"><ArrowLeft className="h-4 w-4" /> Volver</Link>
          </Button>
        </div>
      </header>

      <div className="relative h-[50vh] min-h-[320px] w-full overflow-hidden">
        <img src={route.cover_image ?? ''} alt={route.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
          <div className="mx-auto max-w-4xl">
            {diff && <Badge className={`mb-3 border-0 ${diff.color}`}>{diff.label}</Badge>}
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">{route.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-foreground/90">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> {(route.gpx_parsed as any)?.distance ?? 0} km</span>
              <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" /> {(route.gpx_parsed as any)?.elevation_gain ?? 0} m+</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {waypoints.find((w) => w.type === 'summit')?.elevation ?? '--'} m cumbre</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground">Sobre la ruta</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                {storyParagraphs.length > 0 ? storyParagraphs.map((p, i) => <p key={i}>{p}</p>) : <p>{route.description}</p>}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Galeria</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryImages.map((img, i) => (
                  <button key={i} onClick={() => openLightbox(i)} className="aspect-square overflow-hidden rounded-xl border-0 bg-transparent p-0 cursor-pointer">
                    <img src={img} alt={`Foto ${i + 1}`} className="h-full w-full object-cover transition-transform hover:scale-105" />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">GPX y recorrido</h2>
              <Card className="mt-4 border-border shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <TrendingUp className="mx-auto h-5 w-5 text-primary" />
                      <p className="mt-1 text-lg font-bold">{(route.gpx_parsed as any)?.distance ?? 0} km</p>
                      <p className="text-xs text-muted-foreground">Distancia</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Layers className="mx-auto h-5 w-5 text-secondary" />
                      <p className="mt-1 text-lg font-bold">{(route.gpx_parsed as any)?.elevation_gain ?? 0} m</p>
                      <p className="text-xs text-muted-foreground">Desnivel +</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Star className="mx-auto h-5 w-5 text-accent" />
                      <p className="mt-1 text-lg font-bold">{waypoints.find((w) => w.type === 'summit')?.elevation ?? '--'} m</p>
                      <p className="text-xs text-muted-foreground">Cumbre</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Archivo GPX</p>
                        <p className="text-xs text-muted-foreground">Descarga la ruta para tu GPS</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1"><Download className="h-4 w-4" /> Descargar</Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium mb-2">Vista del recorrido</p>
                    <div className="flex h-48 items-center justify-center rounded-lg bg-muted">
                      <div className="text-center text-muted-foreground">
                        <Map className="mx-auto h-8 w-8 mb-2" />
                        <p className="text-xs">Visualizacion del GPX</p>
                        <p className="text-xs">(Mapa interactivo proximamente)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Waypoints</h2>
              <div className="mt-4 space-y-2">
                {waypoints.sort((a, b) => a.order_index - b.order_index).map((wp) => (
                  <div key={wp.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                    {getWaypointIcon(wp.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{wp.name}</p>
                      <p className="text-xs text-muted-foreground">{wp.elevation ? `${wp.elevation} msnm` : ''}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{wp.type}</Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle className="text-lg">Requisitos tecnicos</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {diff && <div><p className="text-xs text-muted-foreground mb-1">Nivel de dificultad</p><Badge className={`border-0 ${diff.color}`}>{diff.label}</Badge></div>}
                {skills.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Habilidades requeridas</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((s) => <Badge key={s.id} variant="secondary" className="text-xs">{s.skill_tag}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader><CardTitle className="text-lg">Creado por</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-3">
                <img src={creator?.avatar_url ?? ''} alt={creator?.display_name} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
                <div>
                  <p className="font-medium">{creator?.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{creator?.role}</p>
                </div>
              </CardContent>
            </Card>

            {tripsUsing.length > 0 && (
              <Card className="border-border shadow-sm">
                <CardHeader><CardTitle className="text-lg">Salidas con esta ruta</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {tripsUsing.map((trip) => (
                    <Link key={trip.id} to="/expeditions/$tripId" params={{ tripId: trip.id }} className="block rounded-lg border border-border bg-card/50 p-3 text-sm hover:bg-muted transition-colors">
                      <p className="font-medium">{trip.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(trip.start_date).toLocaleDateString('es-CO')}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            <Button className="w-full" asChild>
              <Link to="/trips/new" search={{ routeId: route.id }}>Crear salida con esta ruta</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">MountainPlanner</span>
          </div>
          <p className="text-sm text-muted-foreground">Hecho con pasion por la montana</p>
        </div>
      </footer>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent showCloseButton={false} className="max-w-5xl sm:max-w-5xl w-[95vw] h-[90vh] p-0 border-0 bg-black/95 flex items-center justify-center">
          <DialogTitle className="sr-only">Galeria de imagenes</DialogTitle>
          <button onClick={() => setLightboxOpen(false)} className="absolute right-4 top-4 z-50 rounded-full bg-primary-foreground/10 p-2 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"><X className="h-6 w-6" /></button>
          <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-primary-foreground/10 p-3 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"><ArrowLeft className="h-6 w-6" /></button>
          <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-primary-foreground/10 p-3 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"><ArrowRight className="h-6 w-6" /></button>
          <div className="flex flex-col items-center gap-4">
            <img src={galleryImages[lightboxIndex]} alt={`Foto ${lightboxIndex + 1}`} className="max-h-[80vh] max-w-full object-contain rounded-lg" />
            <p className="text-sm text-primary-foreground/70">{lightboxIndex + 1} / {galleryImages.length}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
