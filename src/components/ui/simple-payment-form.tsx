'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { User, CreditCard, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

interface SimplePaymentFormProps {
  onPaymentCreated: (payment: any) => void
  onPaymentStatusChange: (status: string) => void
  valor?: number
}

export function SimplePaymentForm({ onPaymentCreated, onPaymentStatusChange, valor = 100 }: SimplePaymentFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [cpf, setCpf] = useState('')

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    
    if (numbers.length !== 11) return false
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false
    
    // Validação do primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i)
    }
    let digit = 11 - (sum % 11)
    if (digit > 9) digit = 0
    if (digit !== parseInt(numbers.charAt(9))) return false
    
    // Validação do segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i)
    }
    digit = 11 - (sum % 11)
    if (digit > 9) digit = 0
    if (digit !== parseInt(numbers.charAt(10))) return false
    
    return true
  }


  const createPayment = async () => {
    // Validar CPF (obrigatório para PIX)
    if (!cpf.trim()) {
      toast({
        title: 'CPF Obrigatório',
        description: 'É necessário informar o CPF para gerar o pagamento PIX.',
        variant: 'destructive'
      })
      return
    }

    // Validar se o CPF é válido
    if (!validateCPF(cpf)) {
      toast({
        title: 'CPF Inválido',
        description: 'Por favor, informe um CPF válido.',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/payment/asaas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: valor,
          method: 'PIX',
          description: `TaPago - Mensalidade ${new Date().toISOString().slice(0, 7)}`,
          cpf: cpf
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      setPayment(data.payment)
      onPaymentCreated?.(data.payment)
      
      toast({
        title: 'Pagamento Criado!',
        description: 'Use o QR Code ou código PIX para pagar.'
      })

    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar pagamento',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = () => {
    if (payment?.pixPayload) {
      navigator.clipboard.writeText(payment.pixPayload)
      setCopied(true)
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para a área de transferência'
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'Aprovado'
      case 'PENDING': return 'Pendente'
      case 'REJECTED': return 'Rejeitado'
      default: return 'Desconhecido'
    }
  }

  if (payment) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Pagamento PIX
            </span>
            <span className="flex items-center gap-2 text-sm sm:text-base">
              {getStatusIcon(payment.status)}
              {getStatusText(payment.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor</label>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              R$ {payment.amount.toFixed(2).replace('.', ',')}
            </div>
          </div>

          {payment.pixQrCode && (
            <div className="space-y-3">
              <label className="text-sm font-medium">QR Code PIX</label>
              <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <img
                  src={payment.pixQrCode}
                  alt="QR Code PIX"
                  className="mx-auto w-48 h-48 sm:max-w-48 sm:max-h-48 object-contain"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                Escaneie o QR Code com seu app do banco
              </p>
            </div>
          )}

          {payment.pixPayload && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Código PIX</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  value={payment.pixPayload}
                  readOnly
                  className="flex-1 font-mono text-xs sm:text-sm"
                />
                <Button
                  onClick={copyPixCode}
                  variant="outline"
                  size="sm"
                  className="px-3 w-full sm:w-auto"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  <span className="ml-2">{copied ? 'Copiado!' : 'Copiar'}</span>
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Ou copie o código PIX e cole no seu app do banco
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>💡 Instruções:</strong> Escaneie o QR Code ou copie o código PIX para pagar. O pagamento será confirmado automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          Pagamento PIX - R$ {valor.toFixed(2).replace('.', ',')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Campo CPF */}
        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-sm font-medium">CPF *</Label>
          <div className="relative">
            <Input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value)
                setCpf(formatted)
              }}
              maxLength={14}
              className={`font-mono pr-10 text-sm sm:text-base ${
                cpf.length === 14 
                  ? validateCPF(cpf) 
                    ? 'border-green-500 focus:border-green-500' 
                    : 'border-red-500 focus:border-red-500'
                  : ''
              }`}
            />
            {cpf.length === 14 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {validateCPF(cpf) ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          <p className={`text-xs ${
            cpf.length === 14 && !validateCPF(cpf) 
              ? 'text-red-500' 
              : 'text-gray-500'
          }`}>
            {cpf.length === 14 && !validateCPF(cpf) 
              ? 'CPF inválido. Por favor, verifique os números digitados.'
              : 'CPF é obrigatório para gerar o pagamento PIX'
            }
          </p>
        </div>

        {/* Informações */}
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-green-800">
            <strong>✅ Vantagens:</strong>
          </p>
          <ul className="text-xs sm:text-sm text-green-700 mt-2 space-y-1">
            <li>• Pagamento instantâneo e seguro</li>
            <li>• Confirmação automática</li>
            <li>• Apenas CPF necessário</li>
            <li>• Ativação imediata da conta</li>
          </ul>
        </div>

        {/* Botão de Pagamento */}
        <Button
          onClick={createPayment}
          disabled={loading}
          className="w-full h-12 sm:h-10 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Criando Pagamento...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar PIX
            </>
          )}
        </Button>

        {/* Informação sobre dados */}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>📄 Nota Fiscal:</strong> O CPF será usado para emissão da nota fiscal. 
            Outros dados podem ser preenchidos posteriormente no painel do Asaas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
