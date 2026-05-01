import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { mockTrips, mockRoutes } from '#/lib/mock-data'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/_app/trips/$tripId/edit')({
  component: EditTripPage,
})

function EditTripPage() {
  const { tripId } = Route.useParams()
  const trip = mockTrips.find((t) => t.id === tripId)

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
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/trips/$tripId" params={{ tripId }}>
          <ArrowLeft className="h-4 w-4" /> Volver a la salida
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar salida</h1>
        <p className="text-muted-foreground">{trip.title}</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" defaultValue={trip.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting">Punto de encuentro</Label>
              <Input id="meeting" defaultValue={trip.meeting_point ?? ''} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Inicio</Label>
                <Input id="start" type="datetime-local" defaultValue={trip.start_date.slice(0, 16)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Regreso</Label>
                <Input id="end" type="datetime-local" defaultValue={trip.end_date?.slice(0, 16) ?? ''} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ritmo</Label>
                <Select defaultValue={trip.pace}>
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
                <Input id="max" type="number" defaultValue={trip.max_participants ?? ''} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select defaultValue={trip.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="open">Abierta</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/trips/$tripId" params={{ tripId }}>Cancelar</Link>
          </Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
