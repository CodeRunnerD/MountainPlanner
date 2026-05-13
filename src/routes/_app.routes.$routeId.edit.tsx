import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { supabase } from '#/lib/supabase'
import { getUserWithProfile } from '#/lib/session.functions'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { Tables } from '#/types/database.types'

type Route = Tables<'routes'>

export const Route = createFileRoute('/_app/routes/$routeId/edit')({
  beforeLoad: async () => {
    const data = await getUserWithProfile()
    const role = data?.profile?.role
    if (role !== 'organizer' && role !== 'expedition_lead') {
      throw redirect({ to: '/routes' })
    }
  },
  component: EditRoutePage,
})

function EditRoutePage() {
  const navigate = useNavigate()
  const { routeId } = Route.useParams()
  const [route, setRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(true)
  const [newSkill, setNewSkill] = useState('')

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      sourceUrl: '',
      skills: [] as string[],
    },
    onSubmit: async ({ value }) => {
      const { error } = await supabase
        .from('routes')
        .update({
          name: value.name.trim(),
          description: value.description.trim() || null,
          source_url: value.sourceUrl.trim() || null,
        })
        .eq('id', routeId)

      if (error) {
        alert('Error al actualizar: ' + error.message)
        return
      }

      await supabase.from('route_skill_requirements').delete().eq('route_id', routeId)
      if (value.skills.length > 0) {
        await supabase.from('route_skill_requirements').insert(
          value.skills.map((skill) => ({ route_id: routeId, skill_tag: skill }))
        )
      }

      navigate({ to: '/routes/$routeId', params: { routeId } })
    },
  })

  useEffect(() => {
    const fetchRoute = async () => {
      const { data: r } = await supabase.from('routes').select('*').eq('id', routeId).single()
      const { data: s } = await supabase.from('route_skill_requirements').select('skill_tag').eq('route_id', routeId)
      if (r) {
        setRoute(r)
        form.reset({
          name: r.name,
          description: r.description ?? '',
          sourceUrl: r.source_url ?? '',
          skills: s?.map((x) => x.skill_tag) || [],
        })
      }
      setLoading(false)
    }
    fetchRoute()
  }, [routeId])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ruta no encontrada</p>
        <Button asChild variant="link"><Link to="/routes">Volver</Link></Button>
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
                  <Label htmlFor={field.name}>Nombre</Label>
                  <Input
                    id={field.name}
                    name={field.name}
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
                  <Label htmlFor={field.name}>URL fuente</Label>
                  <Input
                    id={field.name}
                    name={field.name}
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
            <Link to="/routes/$routeId" params={{ routeId }}>Cancelar</Link>
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
