'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Clock, FileText, Shield, Zap, Globe, MessageCircle } from 'lucide-react'
import { SimplePaymentForm } from '@/components/ui/simple-payment-form'

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

  const handlePaymentCreated = (paymentData: any) => {
    toast({
      title: 'Pagamento Criado!',
      description: 'Seu pagamento foi gerado com sucesso. Use o QR Code ou código PIX para pagar.'
    })
  }

  const handlePaymentStatusChange = (status: string) => {
    if (status === 'APPROVED') {
          toast({
        title: 'Pagamento Aprovado!',
        description: 'Sua conta foi ativada com sucesso. Redirecionando...'
          })
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
    }
  }

  const handleWhatsAppSupport = () => {
    const phoneNumber = '551231974950' // Número com código do país (55) + DDD (12) + número
    const message = encodeURIComponent('Olá! Estou com problemas no pagamento da licença do Tapago. Preciso de ajuda!')
    const url = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(url, '_blank')
  }




  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-8 pb-6">
        {/* Header - Otimizado para mobile */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pagamento Pendente</h1>
          <p className="text-gray-600 text-base sm:text-lg px-2">
            Complete seu pagamento para acessar o sistema TaPago
          </p>
        </div>

        {/* Cards de Benefícios - Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <CardTitle className="text-base sm:text-lg">Seguro</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs sm:text-sm text-gray-600">
                Transações protegidas com criptografia de ponta
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <CardTitle className="text-base sm:text-lg">Rápido</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs sm:text-sm text-gray-600">
                Ativação automática após confirmação do pagamento
              </p>
            </CardContent>
          </Card>

          <Card className="text-center sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <CardTitle className="text-base sm:text-lg">Global</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs sm:text-sm text-gray-600">
                Infraestrutura hospedada na Vercel com alta disponibilidade
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Pagamento - Prioridade máxima */}
        <div className="max-w-2xl mx-auto mb-4 sm:mb-8">
          <SimplePaymentForm
            valor={100}
            onPaymentCreated={handlePaymentCreated}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        </div>

        {/* Informações Adicionais - Compacto para mobile */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-4">
              <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">💡 Como funciona:</h3>
                <ol className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
                  <li>1. Informe seu CPF para gerar o pagamento PIX</li>
                  <li>2. Escaneie o QR Code ou copie o código PIX</li>
                  <li>3. Complete o pagamento no seu app do banco</li>
                  <li>4. Aguarde a confirmação automática (até 5 minutos)</li>
                  <li>5. Sua conta será ativada automaticamente</li>
                </ol>
              </div>

              <div className="bg-green-50 p-2 sm:p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-1 sm:mb-2 text-sm sm:text-base">✅ Vantagens:</h3>
                <ul className="text-xs sm:text-sm text-green-800 space-y-0.5 sm:space-y-1">
                  <li>• Pagamento PIX instantâneo</li>
                  <li>• Confirmação automática via webhook</li>
                  <li>• Interface moderna e intuitiva</li>
                  <li>• Suporte 24/7</li>
                </ul>
              </div>

              <div className="text-center text-xs sm:text-sm text-gray-500">
                <p>🔒 Transação segura via Asaas</p>
                <p className="mt-1">💳 Aceitamos apenas PIX</p>
              </div>

              {/* Botão de Suporte WhatsApp */}
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <p className="text-sm sm:text-base text-green-800 mb-3">
                    <strong>🆘 Precisa de ajuda?</strong>
                  </p>
                  <p className="text-xs sm:text-sm text-green-700 mb-3">
                    Qualquer dúvida ou problema com o pagamento, entre em contato conosco!
                  </p>
                  <Button
                    onClick={handleWhatsAppSupport}
                    className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chamar WhatsApp (12) 3197-4950
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer - Sempre visível */}
        <div className="text-center mt-4 sm:mt-8 text-xs sm:text-sm text-gray-500 pb-2">
          <p>Precisa de ajuda? Entre em contato conosco</p>
        </div>
      </div>

      {/* Botão Flutuante WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={handleWhatsAppSupport}
          className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 p-0"
          aria-label="Suporte via WhatsApp"
        >
          <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
        </Button>
        {/* Tooltip sempre visível */}
        <div className="absolute -top-16 right-0 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3 w-3" />
            <span>Dúvidas? Chame no WhatsApp!</span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    </div>
  )
}