import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Mountain, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { user, signUp } = useAuth()
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm: '',
    },
    validators: {
      onSubmit: ({ value }) => {
        if (value.password !== value.confirm) {
          return 'Las contraseñas no coinciden'
        }
        if (value.password.length < 6) {
          return 'La contraseña debe tener al menos 6 caracteres'
        }
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      setFormError('')
      const { error } = await signUp(value.email, value.password, { display_name: value.name })
      if (error) {
        setFormError(error.message)
        return
      }
      setSuccess(true)
    },
  })

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full space-y-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MountainPlanner</span>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-md">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-foreground">¡Cuenta creada!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.
            </p>
            <Button className="mt-4 w-full" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MountainPlanner</span>
          </div>
          <p className="text-sm text-muted-foreground">Crea tu cuenta para empezar</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-md">
          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <form.Field
              name="name"
              validators={{
                onSubmit: ({ value }) => (!value.trim() ? 'El nombre es requerido' : undefined),
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Nombre completo</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Carlos Montaña"
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
              name="email"
              validators={{
                onSubmit: ({ value }) => (!value.trim() ? 'El correo es requerido' : undefined),
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Correo electrónico</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="tu@email.com"
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
              name="password"
              validators={{
                onSubmit: ({ value }) =>
                  value.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : undefined,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Contraseña</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
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
              name="confirm"
              validators={{
                onSubmit: ({ value }) =>
                  !value ? 'Confirma tu contraseña' : undefined,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Confirmar contraseña</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder="••••••••"
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
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting, state.errorMap]}
              children={([canSubmit, isSubmitting, errorMap]) => (
                <>
                  {typeof errorMap === 'object' && errorMap.onSubmit && (
                    <p className="text-xs text-destructive">{errorMap.onSubmit}</p>
                  )}
                  <Button type="submit" className="w-full gap-2" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            />
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
