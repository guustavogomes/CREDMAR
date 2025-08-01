"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  User, 
  ArrowLeft
} from "lucide-react"

type Payment = {
  id: string
  userId: string
  amount: number
  method: string
  status: string
  description: string | null
  pixCode: string | null
  proofImage: string | null
  month: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get("status") || "all")
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Verificar se o usuário é um administrador
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    // Carregar pagamentos
    const fetchPayments = async () => {
      setLoading(true)
      try {
        const queryParam = filter !== "all" ? `?status=${filter}` : ""
        const response = await fetch(`/api/admin/payments${queryParam}`)
        if (response.ok) {
          const data = await response.json()
          setPayments(data)
        }
      } catch (error) {
        console.error("Erro ao carregar pagamentos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [session, status, router, filter])

  const handleStatusChange = async (paymentId: string, newStatus: string, reason?: string) => {
    try {
      const response = await fetch("/api/admin/payments/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          paymentId, 
          status: newStatus,
          rejectionReason: reason
        }),
      })

      if (response.ok) {
        // Atualizar a lista de pagamentos
        setPayments(payments.map(payment => 
          payment.id === paymentId ? { ...payment, status: newStatus } : payment
        ))
        
        // Limpar estado do diálogo
        setShowRejectionDialog(false)
        setSelectedPaymentId(null)
        setRejectionReason("")
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pagamento:", error)
    }
  }

  const openRejectionDialog = (paymentId: string) => {
    setSelectedPaymentId(paymentId)
    setShowRejectionDialog(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "PENDING":
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-slate-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Aprovado"
      case "REJECTED":
        return "Rejeitado"
      case "PENDING":
        return "Pendente"
      default:
        return status
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "PIX":
        return <CreditCard className="h-5 w-5 text-green-500" />
      case "CREDIT_CARD":
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case "BANK_SLIP":
        return <CreditCard className="h-5 w-5 text-amber-500" />
      default:
        return <CreditCard className="h-5 w-5 text-slate-500" />
    }
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case "PIX":
        return "PIX"
      case "CREDIT_CARD":
        return "Cartão de Crédito"
      case "BANK_SLIP":
        return "Boleto Bancário"
      default:
        return method
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Pagamentos</h1>
        </div>
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter(value)
            router.push(`/admin/payments?status=${value}`, { scroll: false })
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pagamentos</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="APPROVED">Aprovados</SelectItem>
            <SelectItem value="REJECTED">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Lista de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum pagamento encontrado com os filtros selecionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.user.name}</div>
                        <div className="text-sm text-slate-500">{payment.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(payment.method)}
                        <span>{getMethodText(payment.method)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span>{getStatusText(payment.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {payment.status === "PENDING" && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleStatusChange(payment.id, "APPROVED")}
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openRejectionDialog(payment.id)}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/admin/payments/${payment.id}`)}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Rejeição */}
      {showRejectionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Rejeitar Pagamento</h3>
            <p className="mb-4">Por favor, forneça um motivo para a rejeição:</p>
            <textarea
              className="w-full border rounded-md p-2 mb-4 h-32"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo da rejeição..."
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectionDialog(false)
                  setSelectedPaymentId(null)
                  setRejectionReason("")
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (selectedPaymentId) {
                    handleStatusChange(selectedPaymentId, "REJECTED", rejectionReason)
                  }
                }}
                disabled={!rejectionReason.trim()}
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}