'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import QRCode from 'qrcode.react'

interface PaymentGatewayModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentSuccess: () => void
}

export function PaymentGatewayModal({ isOpen, onClose, onPaymentSuccess }: PaymentGatewayModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    id: string
    amount: number
    pixQrCode: string
    pixPayload: string
    dueDate: string
    status: string
  } | null>(null)
  const [cpf, setCpf] = useState('')
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)

  // Gerar pagamento PIX
  const generatePayment = async () => {
    
    if (!cpf || cpf.length < 11) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe um CPF válido',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const requestBody = {
        amount: 100,
        method: 'PIX',
        cpf: cpf.replace(/\D/g, ''),
        description: 'TaPago - Acesso ao Sistema'
      }
         
      const response = await fetch('/api/payment/asaas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        // Usar os dados da API Asaas diretamente
        setPaymentData(data.payment)
        toast({
          title: 'Sucesso',
          description: 'Pagamento PIX gerado com sucesso!'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao gerar pagamento',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar pagamento. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!paymentData?.id) return

    setIsCheckingPayment(true)
    try {
      const response = await fetch(`/api/payment/asaas/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentData.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'APPROVED' || data.status === 'RECEIVED') {
          toast({
            title: 'Pagamento Confirmado!',
            description: 'Seu acesso foi liberado com sucesso!'
          })
          onPaymentSuccess()
        } else {
          toast({
            title: 'Pagamento Pendente',
            description: 'Aguardando confirmação do pagamento...'
          })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error)
    } finally {
      setIsCheckingPayment(false)
    }
  }

  // Verificar pagamento automaticamente a cada 10 segundos
  useEffect(() => {
    if (paymentData?.id && paymentData.status === 'PENDING') {
      const interval = setInterval(checkPaymentStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [paymentData])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Acesso ao Sistema TaPago
          </DialogTitle>
          <DialogDescription>
            Para acessar todas as funcionalidades, realize o pagamento da mensalidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!paymentData ? (
            // Formulário de CPF
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                />
              </div>
              
              <Button 
                onClick={generatePayment} 
                disabled={isLoading || cpf.length < 14}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Pagamento...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gerar Pagamento PIX
                  </>
                )}
              </Button>
            </div>
          ) : (
            // QR Code e dados do pagamento
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pagamento PIX</CardTitle>
                  <CardDescription>
                    Escaneie o QR Code ou copie o código PIX
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      {paymentData.pixQrCode && (
                        <QRCode 
                          value={paymentData.pixPayload} 
                          size={200}
                          level="M"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Código PIX (Copiar e Colar)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={paymentData.pixPayload} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(paymentData.pixPayload)
                          toast({
                            title: 'Copiado!',
                            description: 'Código PIX copiado para a área de transferência'
                          })
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {paymentData.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Vencimento: {new Date(paymentData.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={checkPaymentStatus} 
                      disabled={isCheckingPayment}
                      className="flex-1"
                    >
                      {isCheckingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Verificar Pagamento
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setPaymentData(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Importante:</strong> Após realizar o pagamento, clique em "Verificar Pagamento" 
                  ou aguarde a confirmação automática. Seu acesso será liberado imediatamente.
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
