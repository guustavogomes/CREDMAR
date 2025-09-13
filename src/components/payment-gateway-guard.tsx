'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PaymentGatewayModal } from './payment-gateway-modal'
import { Loader2 } from 'lucide-react'

interface PaymentGatewayGuardProps {
  children: React.ReactNode
}

export function PaymentGatewayGuard({ children }: PaymentGatewayGuardProps) {
  const { data: session, status } = useSession()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      setIsChecking(false)
      return
    }

    if (session?.user) {
      // Verificar se o usuário precisa pagar
      if (session.user.status === 'PENDING_PAYMENT') {
        setShowPaymentModal(true)
        setIsChecking(false)
      } else if (session.user.status === 'ACTIVE') {
        setShowPaymentModal(false)
        setIsChecking(false)
      } else {
        // Usuário com status diferente (PENDING_APPROVAL, SUSPENDED, etc.)
        setIsChecking(false)
      }
    }
  }, [session, status])

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    // Recarregar a página para atualizar a sessão
    window.location.reload()
  }

  // Mostrar loading enquanto verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Mostrar modal de pagamento se necessário
  if (showPaymentModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao TaPago!
            </h1>
            <p className="text-gray-600">
              Para acessar todas as funcionalidades, realize o pagamento da mensalidade.
            </p>
          </div>
          
          <PaymentGatewayModal
            isOpen={true}
            onClose={() => {}} // Não permite fechar
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    )
  }

  // Usuário logado e com pagamento em dia - mostrar conteúdo
  return <>{children}</>
}
