import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Mountain, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '#/contexts/AuthContext'
import { useState } from 'react'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { user, resendConfirmation, signOut } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const email = user?.email ?? ''

  const handleResend = async () => {
    if (!email) return
    setSending(true)
    const { error } = await resendConfirmation(email)
    setSending(false)
    if (!error) setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <Mountain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">MountainPlanner</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-foreground">Verifica tu correo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviamos un enlace de confirmación a{' '}
            <span className="font-medium text-foreground">{email}</span>. Revisa tu bandeja de entrada y sigue las instrucciones.
          </p>

          {sent && (
            <p className="mt-4 text-sm text-green-600">
              ¡Correo reenviado! Revisa tu bandeja de entrada.
            </p>
          )}

          <div className="mt-6 space-y-3">
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={sending || sent}
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sent ? 'Correo reenviado' : 'Reenviar correo'}
            </Button>

            <Button variant="outline" className="w-full gap-1" asChild>
              <Link to="/login">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </Button>
          </div>

          <button
            onClick={() => signOut()}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
          >
            Cerrar sesión y usar otra cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
