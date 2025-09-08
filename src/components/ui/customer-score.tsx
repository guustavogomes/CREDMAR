"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Phone, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  X
} from "lucide-react"

type CustomerScore = {
  found: boolean
  customer?: {
    cpf: string
    nomeCompleto: string
    celular: string
    foto?: string
    endereco: string
  }
  score?: {
    value: number
    class: string
    color: string
  }
  statistics?: {
    totalLoans: number
    activeLoans: number
    completedLoans: number
    cancelledLoans: number
    totalInstallments: number
    paidInstallments: number
    overdueInstallments: number
    pendingInstallments: number
    averageDelayDays: number
    paymentRate: number
    // Histórico perpétuo de atrasos
    totalDelayedInstallments: number
    totalDelayDays: number
    hasDelayOver5Days: boolean
    maxDelayDays: number
  }
  companies?: Array<{
    name: string
    email: string
    activeLoans: number
    totalLoans: number
  }>
  riskAnalysis?: {
    hasOverduePayments: boolean
    hasActiveLoans: boolean
    hasCancelledLoans: boolean
    averageDelayDays: number
    recommendation: string
  }
}

interface CustomerScoreProps {
  scoreData: CustomerScore | null
  onClose: () => void
}

export function CustomerScore({ scoreData, onClose }: CustomerScoreProps) {
  if (!scoreData || !scoreData.found) {
    return null
  }

  const { customer, score, statistics, companies, riskAnalysis } = scoreData

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 700) return "text-green-600 bg-green-50"
    if (scoreValue >= 500) return "text-blue-600 bg-blue-50"
    if (scoreValue >= 300) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }

  const getRiskIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BAIXO_RISCO':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'MEDIO_RISCO':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'ALTO_RISCO':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getRiskText = (recommendation: string) => {
    switch (recommendation) {
      case 'BAIXO_RISCO':
        return 'Baixo Risco'
      case 'MEDIO_RISCO':
        return 'Médio Risco'
      case 'ALTO_RISCO':
        return 'Alto Risco'
      default:
        return 'Risco Indefinido'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Score do Cliente</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informações do Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {customer?.foto ? (
                    <img 
                      src={customer.foto} 
                      alt={customer.nomeCompleto}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold">{customer?.nomeCompleto}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>CPF: {customer?.cpf}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{customer?.celular}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{customer?.endereco}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score e Classificação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Score de Crédito</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(score?.value || 0)}`}>
                    {score?.value}
                  </div>
                  <Badge variant="outline" className={getScoreColor(score?.value || 0)}>
                    {score?.class}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getRiskIcon(riskAnalysis?.recommendation || '')}
                  <span>Análise de Risco</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Classificação:</span>
                    <span className="font-semibold">
                      {getRiskText(riskAnalysis?.recommendation || '')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atraso Médio:</span>
                    <span className="font-semibold">
                      {riskAnalysis?.averageDelayDays || 0} dias
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Pagamento:</span>
                    <span className="font-semibold">
                      {statistics?.paymentRate || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Empréstimos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics?.totalLoans || 0}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics?.activeLoans || 0}</div>
                  <div className="text-sm text-gray-600">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{statistics?.completedLoans || 0}</div>
                  <div className="text-sm text-gray-600">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{statistics?.overdueInstallments || 0}</div>
                  <div className="text-sm text-gray-600">Em Atraso</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HISTÓRICO PERPÉTUO DE ATRASOS */}
          {(statistics?.totalDelayedInstallments || 0) > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <TrendingDown className="h-5 w-5" />
                  <span>Histórico de Atrasos (Registro Permanente)</span>
                </CardTitle>
                <p className="text-sm text-orange-600 mt-2">
                  Estas informações ficam registradas permanentemente, mas o score pode se recuperar com bom comportamento.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {statistics?.totalDelayedInstallments || 0}
                    </div>
                    <div className="text-sm text-orange-600">Parcelas Atrasadas</div>
                    <div className="text-xs text-orange-500">(Registro Permanente)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {statistics?.totalDelayDays || 0}
                    </div>
                    <div className="text-sm text-orange-600">Dias de Atraso</div>
                    <div className="text-xs text-orange-500">(Total Histórico)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {statistics?.maxDelayDays || 0}
                    </div>
                    <div className="text-sm text-orange-600">Maior Atraso</div>
                    <div className="text-xs text-orange-500">(Recorde)</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${statistics?.hasDelayOver5Days ? 'text-red-700' : 'text-green-700'}`}>
                      {statistics?.hasDelayOver5Days ? 'SIM' : 'NÃO'}
                    </div>
                    <div className="text-sm text-orange-600">Atraso &gt; 5 dias</div>
                    <div className="text-xs text-orange-500">(Penalização Severa)</div>
                  </div>
                </div>
                {statistics?.hasDelayOver5Days && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">
                        Este cliente já teve atraso superior a 5 dias (penalidade de -500 pontos aplicada)
                      </span>
                    </div>
                    <div className="text-sm text-red-600 mt-1">
                      ℹ️ O score pode ser recuperado com bom comportamento, mas este registro permanece na ficha.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empresas Relacionadas - COMENTADO TEMPORARIAMENTE PARA APROVAÇÃO DAS EMPRESAS */}
          {/* 
          {companies && companies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Empresas com Relacionamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companies.map((company, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold">{company.name}</div>
                        <div className="text-sm text-gray-600">{company.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="font-semibold text-green-600">{company.activeLoans}</span> ativos
                        </div>
                        <div className="text-sm text-gray-600">
                          {company.totalLoans} total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          */}

          {/* Alertas */}
          {(riskAnalysis?.hasOverduePayments || riskAnalysis?.hasCancelledLoans || statistics?.totalDelayedInstallments) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Alertas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics?.hasDelayOver5Days && (
                    <div className="flex items-center space-x-2 text-red-800 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      <span>ALERTA CRÍTICO: Cliente já teve atraso superior a 5 dias!</span>
                    </div>
                  )}
                  {statistics?.totalDelayedInstallments && statistics.totalDelayedInstallments > 0 && (
                    <div className="flex items-center space-x-2 text-orange-700">
                      <TrendingDown className="h-4 w-4" />
                      <span>Cliente possui {statistics.totalDelayedInstallments} parcelas com histórico de atraso</span>
                    </div>
                  )}
                  {riskAnalysis?.hasOverduePayments && (
                    <div className="flex items-center space-x-2 text-orange-700">
                      <Clock className="h-4 w-4" />
                      <span>Cliente possui parcelas em atraso atualmente</span>
                    </div>
                  )}
                  {riskAnalysis?.hasCancelledLoans && (
                    <div className="flex items-center space-x-2 text-orange-700">
                      <X className="h-4 w-4" />
                      <span>Cliente possui empréstimos cancelados</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}