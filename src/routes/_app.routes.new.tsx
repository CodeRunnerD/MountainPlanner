import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { ArrowLeft, Plus, X, Upload } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/routes/new')({
  component: NewRoutePage,
})

function NewRoutePage() {
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="gap-1">
        <Link to="/routes">
          <ArrowLeft className="h-4 w-4" /> Volver a rutas
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Nueva ruta</h1>
        <p className="text-muted-foreground">Registra una nueva ruta de montaña</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la ruta</Label>
              <Input id="name" placeholder="Ej: Cumbre del Nevado del Tolima" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la ruta, dificultad, paisajes..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">URL fuente (Wikiloc u otro)</Label>
              <Input id="source" placeholder="https://wikiloc.com/..." />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Archivo GPX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:bg-muted/50">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Arrastra un archivo GPX o haz clic para subir</p>
                <p className="text-xs text-muted-foreground">.gpx, .tcx</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Habilidades requeridas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Manejo de cuerdas"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" variant="secondary" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/routes">Cancelar</Link>
          </Button>
          <Button type="submit">Guardar ruta</Button>
        </div>
      </form>
    </div>
  )
}
