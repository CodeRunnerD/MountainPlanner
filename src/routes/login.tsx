import { createFileRoute, Link, useNavigate, useLocation } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Mountain, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const search = location.search as Record<string, unknown>
  const redirect = typeof search.redirect === 'string' ? search.redirect : undefined
  const { user, signIn } = useAuth()
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!user) return

    // Check email confirmation
    if (!user.email_confirmed_at) {
      navigate({ to: '/verify-email' })
      return
    }

    // Check approval status
    const approval = user.profile?.approval_status
    if (approval === 'pending_approval') {
      navigate({ to: '/waiting-approval' })
      return
    }
    if (approval === 'rejected') {
      navigate({ to: '/waiting-approval' })
      return
    }

    // Approved and email confirmed
    if (redirect && redirect.startsWith('/')) {
      navigate({ href: redirect })
    } else {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate, redirect])

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setFormError('')
      const { error } = await signIn(value.email, value.password)
      if (error) {
        setFormError(
          error.message === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos'
            : error.message
        )
      }
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MountainPlanner</span>
          </div>
          <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
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
                onSubmit: ({ value }) => (!value ? 'La contraseña es requerida' : undefined),
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
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" className="w-full gap-2" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            />
          </form>

          <div className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Cuentas de prueba (local):</p>
          <div className="space-y-1 font-mono text-xs">
            <p>carlos@example.com / password123 · <span className="text-primary">organizer</span></p>
            <p>ana@example.com / password123 · <span className="text-primary">expedition_lead</span></p>
            <p>luis@example.com / password123 · <span className="text-primary">participant</span></p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
