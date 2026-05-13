import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Mountain, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '#/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { user, resetPassword } = useAuth()
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, navigate])

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      setFormError('')
      const { error } = await resetPassword(value.email)
      if (error) {
        setFormError(error.message)
        return
      }
      setSuccess(true)
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">MountainPlanner</span>
          </div>
          <p className="text-sm text-muted-foreground">Recupera el acceso a tu cuenta</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-md">
          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
              <p className="text-sm text-muted-foreground">
                Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
              </p>
            </div>
          ) : (
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
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </Button>
                )}
              />
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
