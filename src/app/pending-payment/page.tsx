"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, Upload, AlertTriangle, Copy, Check, Clock, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import QRCodeReact from "qrcode.react"

// Prevent static generation
export const dynamic = 'force-dynamic'

function PendingPaymentContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const { toast } = useToast()
  
  // Chave PIX estática conforme solicitado
  const pixKey = "akljdlkadjkldjalksdjalskdjklasdjlasj"
  const qrCodeData = `00020126580014br.gov.bcb.pix0136${pixKey}0204Pagamento TaPago5303986540100.005802BR5925TaPago6009SAO PAULO62070503***6304`
  
  // Verificar o status do usuário
  const userStatus = session?.user?.status
  const isAwaitingApproval = userStatus === "PENDING_APPROVAL"

  // Buscar status do pagamento
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!session?.user) return
      
      try {
        const response = await fetch("/api/payment/status")
        if (response.ok) {
          const data = await response.json()
          setPaymentStatus(data)
          console.log("[PAYMENT STATUS] Status do pagamento:", data)
        }
      } catch (error) {
        console.error("Erro ao buscar status do pagamento:", error)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    fetchPaymentStatus()
  }, [session])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadProof = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo para enviar.",
        variant: "destructive",
      })
      return
    }

    console.log("[UPLOAD] Iniciando upload do comprovante para usuário:", session?.user?.email)
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/payment/upload-proof", {
        method: "POST",
        body: formData,
      })
      
      console.log("[UPLOAD] Resposta da API:", response.status, response.statusText)

      if (response.ok) {
        toast({
          title: "Comprovante enviado com sucesso!",
          description: "Aguarde a análise do pagamento...",
        })
        setFile(null)
        // Recarregar a página para atualizar o status do usuário
        window.location.reload()
      } else {
        const errorData = await response.json()
        
        if (errorData.error === "ALREADY_SUBMITTED") {
          toast({
            title: "Comprovante já enviado",
            description: errorData.message,
            variant: "destructive",
          })
          // Recarregar a página para mostrar o status correto
          window.location.reload()
        } else {
          throw new Error(errorData.message || "Erro ao enviar comprovante")
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o comprovante. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)
      toast({
        title: "Copiado!",
        description: "Chave PIX copiada para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a chave.",
        variant: "destructive",
      })
    }
  }

  // Mostrar loading enquanto busca o status
  if (isLoadingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando status do pagamento...</p>
        </div>
      </div>
    )
  }

  // Renderizar conteúdo baseado no status
  if (isAwaitingApproval || paymentStatus?.hasSubmittedProof) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center border-b border-slate-100 bg-gradient-to-r from-blue-50 to-green-50">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Comprovante Enviado!</CardTitle>
              <CardDescription className="text-slate-600">
                Seu comprovante foi recebido e está sendo analisado
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Pagamento em Análise
                  </h3>
                  <p className="text-slate-600">
                    Recebemos seu comprovante de pagamento e nossa equipe está verificando as informações.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-blue-800">
                      <Mail className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">Você receberá um e-mail</p>
                        <p className="text-sm">Assim que seu pagamento for aprovado, enviaremos uma confirmação para <strong>{session?.user?.email}</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 space-y-2">
                    <p>⏱️ Tempo de análise: até 24 horas úteis</p>
                    <p>📧 Você será notificado por e-mail quando o acesso for liberado</p>
                    {paymentStatus?.payment?.createdAt && (
                      <p>📅 Comprovante enviado em: {new Date(paymentStatus.payment.createdAt).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => router.push("/login")}
                  className="w-full"
                >
                  Voltar para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Pagamento Pendente</CardTitle>
            <CardDescription className="text-slate-600">
              Para acessar o sistema, é necessário realizar o pagamento da mensalidade
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  Pague com PIX
                </h3>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border shadow-md">
                    <QRCodeReact value={qrCodeData} size={200} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Chave PIX:</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={pixKey}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPixKey}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-center text-sm text-slate-600">
                  <p>Valor: <span className="font-bold">R$ 100,00</span></p>
                  <p>Descrição: Mensalidade TaPago</p>
                </div>
              </div>

              {/* Upload Comprovante */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Envie o Comprovante
                </h3>
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="proof"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="proof"
                    className="cursor-pointer block w-full"
                  >
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-medium mb-2">
                      {file ? file.name : "Clique para selecionar o comprovante"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                    </p>
                  </label>
                </div>
                <Button
                  onClick={uploadProof}
                  disabled={!file || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Enviando..." : "Enviar Comprovante"}
                </Button>
                <div className="text-sm text-slate-600 text-center">
                  <p>
                    Após o envio do comprovante, seu pagamento será analisado e
                    seu acesso será liberado em até 24 horas úteis.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PendingPaymentPage() {
  return (
    <AuthGuard 
      requireAuth={true}
      allowedRoles={["USER", "ADMIN"]}
      allowedStatuses={["PENDING_PAYMENT", "PENDING_APPROVAL"]}
      redirectTo="/login"
    >
      <PendingPaymentContent />
    </AuthGuard>
  )
}