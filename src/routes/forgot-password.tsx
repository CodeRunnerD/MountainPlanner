import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Mountain, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
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
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <Button type="submit" className="w-full">
              Enviar enlace de recuperación
            </Button>
          </form>
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
