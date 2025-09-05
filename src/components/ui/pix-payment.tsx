'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Copy, QrCode, Loader2 } from 'lucide-react'

interface PixPaymentProps {
  valor?: number
  onPaymentGenerated?: (data: any) => void
}

export function PixPayment({ valor = 100, onPaymentGenerated }: PixPaymentProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [customValor, setCustomValor] = useState(valor)

  const generatePix = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/pix/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valor: customValor,
          identificador: `TAPAGO-${Date.now()}`,
          descricao: 'Pagamento mensal Tapago'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPixData(data)
        
        // Salvar pagamento no banco
        try {
          const paymentResponse = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: customValor,
              method: 'PIX',
              description: `Pagamento PIX - ${new Date().toLocaleDateString()}`,
              pixCode: data.qrCode
            })
          })

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json()
            onPaymentGenerated?.({ ...data, payment: paymentData })
          }
        } catch (error) {
          console.error('Erro ao salvar pagamento:', error)
        }
        
        toast({
          title: 'QR Code gerado!',
          description: 'Escaneie o código para realizar o pagamento'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao gerar QR Code PIX',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar QR Code PIX',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = async () => {
    if (pixData?.qrCode) {
      try {
        // Extrair apenas o código PIX do data URL
        const pixCode = pixData.qrCode.split(',')[1] // Remove o prefixo data:image/png;base64,
        await navigator.clipboard.writeText(pixCode)
        
        toast({
          title: 'Copiado!',
          description: 'Código PIX copiado para a área de transferência'
        })
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao copiar código PIX',
          variant: 'destructive'
        })
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Pagamento PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pixData ? (
          <>
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                value={customValor}
                onChange={(e) => setCustomValor(parseFloat(e.target.value) || 0)}
                placeholder="100.00"
              />
            </div>
            
            <Button 
              onClick={generatePix} 
              disabled={loading || customValor <= 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QR Code PIX
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <img 
                src={pixData.qrCode} 
                alt="QR Code PIX" 
                className="w-full max-w-64 mx-auto"
              />
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Valor:</strong> R$ {pixData.valor.toFixed(2)}</p>
              <p><strong>Recebedor:</strong> {pixData.nomeRecebedor}</p>
              <p><strong>Chave PIX:</strong> {pixData.chavePix}</p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={copyPixCode}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Código
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setPixData(null)}
                className="flex-1"
              >
                Novo QR Code
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
              <p><strong>Como pagar:</strong></p>
              <p>1. Abra o app do seu banco</p>
              <p>2. Escaneie o QR Code acima</p>
              <p>3. Confirme o pagamento</p>
              <p>4. Envie o comprovante</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}