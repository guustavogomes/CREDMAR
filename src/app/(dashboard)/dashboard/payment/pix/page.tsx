"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import QRCodeReact from "qrcode.react"

// Prevent static generation
export const dynamic = 'force-dynamic'

export default function PixPaymentPage() {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [pixCode, setPixCode] = useState("")
  const [qrCodeData, setQrCodeData] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generatePixPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/payment/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || "Pagamento PIX",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPixCode(data.pixCode)
        setQrCodeData(data.qrCodeData)
        toast({
          title: "PIX gerado com sucesso!",
          description: "Compartilhe o QR Code ou código PIX com o pagador.",
        })
      } else {
        throw new Error("Erro ao gerar PIX")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PIX. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pagamento PIX</h1>
          <p className="text-gray-600">Gere um QR Code para receber pagamentos instantâneos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pagamento</CardTitle>
              <CardDescription>
                Preencha as informações para gerar o PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <Input
                  placeholder="Descrição do pagamento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={generatePixPayment} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Gerando..." : "Gerar PIX"}
              </Button>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code PIX
              </CardTitle>
              <CardDescription>
                Escaneie o código ou copie o código PIX
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qrCodeData ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border">
                      <QRCodeReact value={qrCodeData} size={200} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Código PIX:</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={pixCode}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyPixCode}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    <p>Valor: <span className="font-bold">R$ {parseFloat(amount).toFixed(2)}</span></p>
                    {description && <p>Descrição: {description}</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Preencha os dados e clique em "Gerar PIX" para ver o QR Code</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}