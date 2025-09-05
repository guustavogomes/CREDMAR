'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Clock, FileText, Shield, Zap, Globe } from 'lucide-react'
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
    console.log('Pagamento criado:', paymentData)
    toast({
      title: 'Pagamento Criado!',
      description: 'Seu pagamento foi gerado com sucesso. Use o QR Code ou código PIX para pagar.'
    })
  }

  const handlePaymentStatusChange = (status: string) => {
    console.log('Status do pagamento alterado:', status)
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento Pendente</h1>
          <p className="text-gray-600 text-lg">
            Complete seu pagamento para acessar o sistema TaPago
          </p>
        </div>

        {/* Cards de Benefícios */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
          <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Transações protegidas com criptografia de ponta
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ativação automática após confirmação do pagamento
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Globe className="w-6 h-6 text-purple-600" />
            </div>
              <CardTitle className="text-lg">Global</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Infraestrutura hospedada na Vercel com alta disponibilidade
              </p>
            </CardContent>
          </Card>
            </div>

        {/* Formulário de Pagamento */}
        <div className="max-w-2xl mx-auto">
          <SimplePaymentForm
            valor={100}
            onPaymentCreated={handlePaymentCreated}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        </div>

        {/* Informações Adicionais */}
        <div className="max-w-2xl mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">💡 Como funciona:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Informe seu CPF para gerar o pagamento PIX</li>
                  <li>2. Escaneie o QR Code ou copie o código PIX</li>
                  <li>3. Complete o pagamento no seu app do banco</li>
                  <li>4. Aguarde a confirmação automática (até 5 minutos)</li>
                  <li>5. Sua conta será ativada automaticamente</li>
                </ol>
            </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">✅ Vantagens:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Pagamento PIX instantâneo</li>
                  <li>• Confirmação automática via webhook</li>
                  <li>• Interface moderna e intuitiva</li>
                  <li>• Suporte 24/7</li>
                </ul>
              </div>

                        <div className="text-center text-sm text-gray-500">
                <p>🔒 Transação segura via Asaas</p>
                <p className="mt-1">💳 Aceitamos apenas PIX</p>
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Precisa de ajuda? Entre em contato conosco</p>
        </div>
      </div>
    </div>
  )
}