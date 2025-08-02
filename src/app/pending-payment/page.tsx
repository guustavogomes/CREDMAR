"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, Upload, AlertTriangle, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import QRCodeReact from "qrcode.react"

// Prevent static generation
export const dynamic = 'force-dynamic'

export default function PendingPaymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  
  // Chave PIX estática conforme solicitado
  const pixKey = "akljdlkadjkldjalksdjalskdjklasdjlasj"
  const qrCodeData = `00020126580014br.gov.bcb.pix0136${pixKey}0204Pagamento TaPago5303986540100.005802BR5925TaPago6009SAO PAULO62070503***6304`

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/payment/upload-proof", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Comprovante enviado com sucesso!",
          description: "Redirecionando para o login...",
        })
        setFile(null)
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        throw new Error("Erro ao enviar comprovante")
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