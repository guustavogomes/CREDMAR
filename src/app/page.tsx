'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirecionar baseado no status de autenticação
  useEffect(() => {
    if (status === 'loading') return // Aguardar carregamento

    if (status === 'authenticated' && session?.user) {
      // Se autenticado, redirecionar conforme o role
      if (session.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      // Se não autenticado, redirecionar para login
      router.push('/login')
    }
  }, [status, session, router])

  // Mostrar loading enquanto processa o redirecionamento
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecionando...</p>
      </div>
    </div>
  )
}