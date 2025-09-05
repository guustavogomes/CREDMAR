"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Receipt,
  TrendingUp,
  AlertCircle,
  Plus
} from "lucide-react"
import { PixPayment } from "@/components/ui/pix-payment"

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  description: string | null
  createdAt: string
  proofImage?: string
}

interface PaymentStats {
  totalReceived: number
  totalPending: number
  totalRejected: number
  totalPayments: number
}

export default function PaymentsPage() {
  const [uploading, setUploading] = useState(false)
  const [showPixPayment, setShowPixPayment] = useState(false)

  // Upload de comprovante
  const handleUploadProof = async (e: React.FormEvent<HTMLFormElement>, paymentId: string) => {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.elements.namedItem("file") as HTMLInputElement
    if (!fileInput?.files?.[0]) return
    setUploading(true)
    const formData = new FormData()
    formData.append("paymentId", paymentId)
    formData.append("file", fileInput.files[0])
    try {
      const res = await fetch("/api/payments/upload-proof", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Comprovante enviado!", description: "Aguardando aprovação." })
        fetchPayments()
      } else {
        toast({ title: "Erro", description: data.error || "Erro ao enviar comprovante", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao conectar ao servidor", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  // Remover comprovante enviado (antes de aprovação)
  const handleRemoveProof = async (paymentId: string) => {
    if (!window.confirm("Remover comprovante enviado?")) return
    setUploading(true)
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, removeProof: true })
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Comprovante removido." })
        fetchPayments()
      } else {
        toast({ title: "Erro", description: data.error || "Erro ao remover comprovante", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao conectar ao servidor", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    totalPending: 0,
    totalRejected: 0,
    totalPayments: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments")
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments || [])
        setStats(data.stats || stats)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao carregar pagamentos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "PIX":
        return "💳"
      case "CREDIT_CARD":
        return "💳"
      case "BANK_SLIP":
        return "🧾"
      default:
        return "💰"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
            <p className="text-muted-foreground">Gerencie suas mensalidades e pagamentos do sistema</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowPixPayment(!showPixPayment)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Pagamento PIX
        </Button>
      </div>

      {/* PIX Payment Component */}
      {showPixPayment && (
        <Card className="p-6">
          <PixPayment 
            valor={100} 
            onPaymentGenerated={(data) => {
              console.log('PIX gerado:', data)
              // Aqui você pode adicionar lógica para salvar o pagamento no banco
            }}
          />
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Recebido</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pendente</p>
              <p className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.totalPending)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Rejeitado</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalRejected)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total de Pagamentos</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalPayments}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="bg-background/80 backdrop-blur-sm border-border shadow-lg">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Histórico de Pagamentos</h2>
          </div>
        </div>
        
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-muted-foreground mb-6">Você ainda não realizou nenhum pagamento.</p>
              <p className="text-sm text-muted-foreground">
                As mensalidades são geradas automaticamente todo mês.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getMethodIcon(payment.method)}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground">
                          {payment.description || `Pagamento via ${payment.method}`}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right min-w-[180px] flex flex-col items-end gap-2">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.method}
                    </p>
                    {/* Comprovante UI */}
                    {payment.status === "PENDING" && (
                      <>
                        {payment.proofImage ? (
                          <div className="flex flex-col items-end">
                            <img
                              src={payment.proofImage}
                              alt="Comprovante enviado"
                              className="w-24 h-24 object-contain border rounded mb-1"
                            />
                            <span className="text-xs text-yellow-700 mb-1">Aguardando aprovação</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveProof(payment.id)}
                              className="text-xs"
                            >Remover</Button>
                          </div>
                        ) : (
                          <form onSubmit={e => handleUploadProof(e, payment.id)} className="flex flex-col items-end gap-1">
                            <input
                              type="file"
                              accept="image/*"
                              name="file"
                              required
                              className="block text-xs"
                            />
                            <Button type="submit" size="sm" className="text-xs">Enviar comprovante</Button>
                          </form>
                        )}
                      </>
                    )}
                    {payment.status === "APPROVED" && payment.proofImage && (
                      <div className="flex flex-col items-end">
                        <img
                          src={payment.proofImage}
                          alt="Comprovante aprovado"
                          className="w-24 h-24 object-contain border rounded mb-1"
                        />
                        <span className="text-xs text-green-700">Comprovante aprovado</span>
                      </div>
                    )}
                    {payment.status === "REJECTED" && (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-red-700 mb-1">Comprovante rejeitado</span>
                        <form onSubmit={e => handleUploadProof(e, payment.id)} className="flex flex-col items-end gap-1">
                          <input
                            type="file"
                            accept="image/*"
                            name="file"
                            required
                            className="block text-xs"
                          />
                          <Button type="submit" size="sm" className="text-xs">Reenviar comprovante</Button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}