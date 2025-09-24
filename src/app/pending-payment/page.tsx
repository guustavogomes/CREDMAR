'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Clock, FileText, Shield, MessageCircle } from 'lucide-react'

export default function PendingPaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Se o usuário já tem status ativo, redirecionar para dashboard
    if (session.user.status === 'ACTIVE') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  const handleWhatsAppSupport = () => {
    const phoneNumber = '551231974950' // Número com código do país (55) + DDD (12) + número
    const message = encodeURIComponent('Olá! Preciso fazer o pagamento de R$ 29,90/mês do TaPago para liberar meu acesso ao sistema.')
    const url = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(url, '_blank')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-orange-100 rounded-full">
              <MessageCircle className="h-16 w-16 text-orange-600" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pagamento via WhatsApp
          </h1>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-full text-xl font-bold mb-4 shadow-lg">
            Apenas R$ 29,90/mês
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Para liberar seu acesso ao sistema TaPago, entre em contato conosco pelo WhatsApp.
            Nossa equipe irá te ajudar com o processo de pagamento.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Botão Principal WhatsApp */}
          <div className="space-y-6">
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-green-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-center justify-center">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                  Falar no WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <div className="space-y-6">
                  <div className="text-6xl">📱</div>
                  <div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                      <p className="text-3xl font-bold text-green-700 mb-1">R$ 29,90/mês</p>
                      <p className="text-sm text-green-600">Oferta limitada - Primeiros 100</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      (12) 3197-4950
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Clique no botão abaixo para abrir o WhatsApp e falar com nossa equipe
                    </p>
                    <Button
                      onClick={handleWhatsAppSupport}
                      size="lg"
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-lg font-medium py-4"
                    >
                      <MessageCircle className="w-6 h-6 mr-2" />
                      Abrir WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações e Benefícios */}
          <div className="space-y-6">
            {/* Como Funciona */}
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-6 w-6 text-blue-600" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Clique no WhatsApp</h3>
                      <p className="text-sm text-gray-600">Abra o WhatsApp com nossa equipe</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Informe seus dados</h3>
                      <p className="text-sm text-gray-600">Diga que quer fazer o pagamento do TaPago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Receba orientações</h3>
                      <p className="text-sm text-gray-600">Nossa equipe te orientará sobre o pagamento</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600 flex-shrink-0">✓</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Acesso liberado</h3>
                      <p className="text-sm text-gray-600">Após o pagamento, seu acesso será liberado imediatamente</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefícios */}
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-green-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-6 w-6 text-green-600" />
                  O que você ganha
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gestão Completa de Empréstimos</h3>
                      <p className="text-sm text-gray-600">Cadastre clientes, gerencie parcelas e acompanhe pagamentos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Relatórios Detalhados</h3>
                      <p className="text-sm text-gray-600">Acompanhe sua carteira com relatórios completos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Interface Intuitiva</h3>
                      <p className="text-sm text-gray-600">Sistema fácil de usar, sem complicações</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Suporte Completo</h3>
                      <p className="text-sm text-gray-600">Estamos aqui para te ajudar sempre que precisar</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Importantes */}
            <Card className="border-2 border-orange-200 shadow-lg">
              <CardHeader className="bg-orange-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6 text-orange-600" />
                  Informações Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Horário de Atendimento</p>
                      <p className="text-gray-600">Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Suporte WhatsApp</p>
                      <p className="text-gray-600">Dúvidas? Chame no WhatsApp: (12) 3197-4950</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}