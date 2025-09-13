"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuthRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Ainda carregando

    // Se não estiver autenticado, redirecionar para login
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Se estiver autenticado, verificar status
    if (session?.user) {
      const userStatus = session.user.status
      const userRole = session.user.role


      // Se for admin, redirecionar para área admin
      if (userRole === "ADMIN") {
        router.push("/admin")
        return
      }

      // Se tiver status pendente, redirecionar para pending-payment
      if (userStatus === "PENDING_PAYMENT" || userStatus === "PENDING_APPROVAL") {
        router.push("/pending-payment")
        return
      }

      // Se estiver ativo, redirecionar para dashboard
      if (userStatus === "ACTIVE") {
        router.push("/dashboard")
        return
      }
    }
  }, [session, status, router])

  return { session, status }
}