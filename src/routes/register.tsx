import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Mountain, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
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
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" placeholder="Carlos Montaña" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input id="confirm" type="password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full gap-2">
              Crear cuenta
              <ArrowRight className="h-4 w-4" />
            </Button>
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
