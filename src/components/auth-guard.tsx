"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
  allowedStatuses?: string[]
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = ["USER", "ADMIN"],
  allowedStatuses = ["ACTIVE", "PENDING_PAYMENT", "PENDING_APPROVAL"],
  redirectTo = "/login"
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Ainda carregando


    // Se requer autenticação mas não está autenticado
    if (requireAuth && status === "unauthenticated") {
      router.push(redirectTo)
      return
    }

    // Se está autenticado, verificar permissões
    if (session?.user) {
      const userRole = session.user.role
      const userStatus = session.user.status


      // Verificar role
      if (!allowedRoles.includes(userRole)) {
        router.push("/dashboard")
        return
      }

      // Verificar status
      if (!allowedStatuses.includes(userStatus)) {
        router.push("/pending-payment")
        return
      }
    }
  }, [session, status, router, requireAuth, allowedRoles, allowedStatuses, redirectTo])

  // Mostrar loading enquanto verifica autenticação
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não requer autenticação ou está autenticado com permissões corretas, mostrar conteúdo
  if (!requireAuth || (session && 
      allowedRoles.includes(session.user.role) && 
      allowedStatuses.includes(session.user.status))) {
    return <>{children}</>
  }

  // Caso contrário, mostrar loading (redirecionamento em andamento)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}