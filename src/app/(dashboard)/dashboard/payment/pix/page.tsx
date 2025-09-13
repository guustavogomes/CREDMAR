"use client"

import { AsaasPayment } from "@/components/ui/asaas-payment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Shield, Zap, CreditCard } from "lucide-react"

// Prevent static generation
export const dynamic = 'force-dynamic'

export default function PixPaymentPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pagamento TaPago</h1>
          <p className="text-gray-600">Pague sua mensalidade de forma rápida e segura com o Asaas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Componente de Pagamento */}
          <div className="lg:col-span-2">
            <AsaasPayment 
              valor={100}
              onPaymentCreated={(payment) => {
              }}
              onPaymentStatusChange={(status) => {
              }}
            />
          </div>

          {/* Benefícios */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Segurança Garantida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Criptografia SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Compliance LGPD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Certificação PCI DSS</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">PIX</span>
                    <Badge variant="outline" className="text-green-600">Instantâneo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cartão de Crédito</span>
                    <Badge variant="outline" className="text-blue-600">Seguro</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Boleto Bancário</span>
                    <Badge variant="outline" className="text-orange-600">Tradicional</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Sobre o Asaas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Utilizamos o Asaas, uma das principais plataformas de pagamento do Brasil, 
                  para garantir a segurança e confiabilidade das suas transações.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">+500.000 empresas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">99.9% de uptime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Suporte 24/7</span>
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