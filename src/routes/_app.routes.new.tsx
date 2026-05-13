import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { supabase } from '#/lib/supabase'
import { useAuth } from '#/contexts/AuthContext'
import { getUserWithProfile } from '#/lib/session.functions'
import { ArrowLeft, Plus, X, Upload, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'

export const Route = createFileRoute('/_app/routes/new')({
  beforeLoad: async () => {
    const data = await getUserWithProfile()
    const role = data?.profile?.role
    if (role !== 'organizer' && role !== 'expedition_lead') {
      throw redirect({ to: '/routes' })
    }
  },
  component: NewRoutePage,
})

function NewRoutePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [newSkill, setNewSkill] = useState('')

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      sourceUrl: '',
      skills: [] as string[],
    },
    onSubmit: async ({ value }) => {
      const { data: route, error } = await supabase
        .from('routes')
        .insert({
          name: value.name.trim(),
          description: value.description.trim() || null,
          source_url: value.sourceUrl.trim() || null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error || !route) {
        alert('Error al crear la ruta: ' + (error?.message ?? 'Desconocido'))
        return
      }

      if (value.skills.length > 0) {
        await supabase.from('route_skill_requirements').insert(
          value.skills.map((skill) => ({ route_id: route.id, skill_tag: skill }))
        )
      }

      navigate({ to: '/routes/$routeId', params: { routeId: route.id } })
    },
  })

  const addSkill = () => {
    const trimmed = newSkill.trim()
    if (!trimmed) return
    const current = form.getFieldValue('skills') || []
    if (!current.includes(trimmed)) {
      form.setFieldValue('skills', [...current, trimmed])
    }
    setNewSkill('')
  }

  const removeSkill = (skill: string) => {
    const current = form.getFieldValue('skills') || []
    form.setFieldValue('skills', current.filter((s) => s !== skill))
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

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field
              name="name"
              validators={{
                onSubmit: ({ value }) => (!value.trim() ? 'El nombre es requerido' : undefined),
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Nombre de la ruta</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Ej: Cumbre del Nevado del Tolima"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            />
            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Descripción</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    placeholder="Describe la ruta, dificultad, paisajes..."
                    rows={4}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
            <form.Field
              name="sourceUrl"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>URL fuente (Wikiloc u otro)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="https://wikiloc.com/..."
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            />
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
                <p className="text-xs text-muted-foreground">.gpx, .tcx (próximamente)</p>
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
              {form.getFieldValue('skills')?.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
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
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar ruta
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
