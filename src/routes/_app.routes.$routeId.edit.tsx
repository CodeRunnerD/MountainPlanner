import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { mockRoutes } from '#/lib/mock-data'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/_app/routes/$routeId/edit')({
  component: EditRoutePage,
})

function EditRoutePage() {
  const { routeId } = Route.useParams()
  const route = mockRoutes.find((r) => r.id === routeId)

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ruta no encontrada</p>
        <Button asChild variant="link">
          <Link to="/routes">Volver</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/routes/$routeId" params={{ routeId }}>
          <ArrowLeft className="h-4 w-4" /> Volver a la ruta
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Editar ruta</h1>
        <p className="text-muted-foreground">{route.name}</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" defaultValue={route.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" defaultValue={route.description ?? ''} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">URL fuente</Label>
              <Input id="source" defaultValue={route.source_url ?? ''} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/routes/$routeId" params={{ routeId }}>Cancelar</Link>
          </Button>
          <Button type="submit">Guardar cambios</Button>
        </div>
      </form>
    </div>
  )
}
