import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Mountain, Clock, ArrowLeft } from 'lucide-react'
import { useAuth } from '#/contexts/AuthContext'

export const Route = createFileRoute('/waiting-approval')({
  component: WaitingApprovalPage,
})

function WaitingApprovalPage() {
  const { user, signOut } = useAuth()
  const approvalStatus = user?.profile?.approval_status

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <Mountain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">MountainPlanner</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>

          {approvalStatus === 'rejected' ? (
            <>
              <h2 className="mt-4 text-xl font-bold text-foreground">Solicitud rechazada</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu solicitud de acceso fue rechazada por un organizador. Si crees que es un error, contacta al equipo directamente.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-xl font-bold text-foreground">Esperando aprobación</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu cuenta está siendo revisada por un organizador. Te avisaremos por correo cuando sea aprobada.
              </p>
            </>
          )}

          <div className="mt-6 space-y-3">
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
