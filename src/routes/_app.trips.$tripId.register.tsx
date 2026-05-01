import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Checkbox } from '#/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { mockTrips, mockRoutes } from '#/lib/mock-data'
import { ArrowLeft, Shield, Heart, Phone } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/trips/$tripId/register')({
  component: TripRegistrationPage,
})

function TripRegistrationPage() {
  const { tripId } = Route.useParams()
  const trip = mockTrips.find((t) => t.id === tripId)
  const route = mockRoutes.find((r) => r.id === trip?.route_id)
  const [needsTransport, setNeedsTransport] = useState(false)

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
        <h1 className="text-3xl font-bold text-foreground">Inscripción</h1>
        <p className="text-muted-foreground">
          {trip.title} · {route?.name}
        </p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Información de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="+57 300 123 4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Contacto de emergencia</Label>
              <Input id="emergency" placeholder="Nombre y teléfono" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="transport"
                checked={needsTransport}
                onCheckedChange={(v) => setNeedsTransport(v === true)}
              />
              <Label htmlFor="transport" className="text-sm font-normal">
                Necesito transporte (no tengo vehículo)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Información médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de sangre</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Alergias</Label>
              <Input id="allergies" placeholder="Separadas por coma" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Medicamentos actuales</Label>
              <Textarea id="medications" placeholder="¿Tomas algún medicamento?" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical-notes">Notas médicas adicionales</Label>
              <Textarea id="medical-notes" placeholder="Cualquier otra información relevante..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Datos sensibles (encriptados)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula / Documento de identidad</Label>
              <Input id="cedula" placeholder="1000000000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance">Seguro (opcional)</Label>
              <Input id="insurance" placeholder="Número de póliza" />
            </div>
            <p className="text-xs text-muted-foreground">
              Estos datos se almacenan encriptados y solo los organizadores pueden acceder a ellos en caso de emergencia.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/trips/$tripId" params={{ tripId }}>Cancelar</Link>
          </Button>
          <Button type="submit">Confirmar inscripción</Button>
        </div>
      </form>
    </div>
  )
}
