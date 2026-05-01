import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Badge } from '#/components/ui/badge'
import { mockRoutes, mockTrips, mockProfiles } from '#/lib/mock-data'
import { ArrowLeft, ChevronRight, Plus, X, Map, Calendar, Users, Wrench } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/trips/new')({
  component: NewTripPage,
})

function NewTripPage() {
  const [step, setStep] = useState(1)
  const [selectedRoute, setSelectedRoute] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')

  const addEquipment = () => {
    if (newItem.trim() && !equipment.includes(newItem.trim())) {
      setEquipment([...equipment, newItem.trim()])
      setNewItem('')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/trips">
          <ArrowLeft className="h-4 w-4" /> Volver a salidas
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva salida</h1>
        <p className="text-muted-foreground">Crea una nueva excursión paso a paso</p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            <span
              className={`text-sm ${s === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
            >
              {s === 1 ? 'Ruta' : s === 2 ? 'Fecha' : 'Equipo'}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Paso 1: Selecciona la ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ruta</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige una ruta..." />
                </SelectTrigger>
                <SelectContent>
                  {mockRoutes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.gpx_parsed?.distance ?? 0} km)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoute && (
              <div className="rounded-lg bg-muted/50 p-4">
                {(() => {
                  const r = mockRoutes.find((rt) => rt.id === selectedRoute)
                  return r ? (
                    <div className="space-y-1">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.gpx_parsed?.distance} km · {r.gpx_parsed?.elevation_gain} m+ · Por{' '}
                        {mockProfiles.find((p) => p.id === r.created_by)?.display_name}
                      </p>
                    </div>
                  ) : null
                })()}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!selectedRoute}>
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Paso 2: Detalles de la salida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la salida</Label>
              <Input id="title" placeholder="Ej: Ascenso Tolima — Enero 2026" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Fecha y hora de inicio</Label>
                <Input id="start" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fecha y hora de regreso</Label>
                <Input id="end" type="datetime-local" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting">Punto de encuentro</Label>
              <Input id="meeting" placeholder="Dirección o lugar" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ritmo</Label>
                <Select defaultValue="medium">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Lento</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="sport">Sport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Máximo participantes</Label>
                <Input id="max" type="number" placeholder="Ej: 8" />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={() => setStep(3)}>
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Paso 3: Equipo requerido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Crampones, Casco..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
              />
              <Button type="button" variant="secondary" onClick={addEquipment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {equipment.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1 pr-1">
                  {item}
                  <button
                    type="button"
                    onClick={() => setEquipment(equipment.filter((i) => i !== item))}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button>Crear salida</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
