"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, User } from "lucide-react"

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
  approvedBy: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function PaymentDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)

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

    // Carregar detalhes do pagamento
    const fetchPaymentDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/payments/${params.id}`)
        
        if (response.ok) {
          const data = await response.json()
          setPayment(data)
        } else {
          // Pagamento não encontrado
          router.push("/admin/payments")
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do pagamento:", error)
        router.push("/admin/payments")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPaymentDetails()
    }
  }, [session, status, router, params.id])

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (!payment) return

    try {
      const response = await fetch("/api/admin/payments/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          paymentId: payment.id, 
          status: newStatus,
          rejectionReason: reason
        }),
      })

      if (response.ok) {
        // Atualizar o pagamento
        const updatedPayment = await response.json()
        setPayment({ ...payment, ...updatedPayment })
      }
    } catch (error) {
      console.error("Erro ao atualizar status do pagamento:", error)
    }
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
        return <Clock className="h-5 w-5 text-slate-500" />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-slate-500 mb-4">Pagamento não encontrado</p>
        <Button onClick={() => router.push("/admin/payments")}>Voltar para Pagamentos</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/admin/payments")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Detalhes do Pagamento</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Informações do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon(payment.status)}
                <span>{getStatusText(payment.status)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Valor:</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Método:</span>
              <div className="flex items-center space-x-2">
                {getMethodIcon(payment.method)}
                <span>{getMethodText(payment.method)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Data de Criação:</span>
              <span>{formatDate(payment.createdAt)}</span>
            </div>

            {payment.month && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Mês de Referência:</span>
                <span>{payment.month}</span>
              </div>
            )}

            {payment.description && (
              <div className="pt-2">
                <span className="font-medium">Descrição:</span>
                <p className="mt-1 text-slate-600">{payment.description}</p>
              </div>
            )}

            {payment.status === "APPROVED" && payment.approvedAt && (
              <div className="pt-2">
                <span className="font-medium">Aprovado em:</span>
                <p className="mt-1 text-slate-600">{formatDate(payment.approvedAt)}</p>
              </div>
            )}

            {payment.status === "REJECTED" && (
              <div className="pt-2">
                <span className="font-medium">Rejeitado em:</span>
                <p className="mt-1 text-slate-600">{payment.rejectedAt ? formatDate(payment.rejectedAt) : "N/A"}</p>
                {payment.rejectionReason && (
                  <>
                    <span className="font-medium">Motivo da Rejeição:</span>
                    <p className="mt-1 text-slate-600">{payment.rejectionReason}</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Nome:</span>
              <span>{payment.user.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-medium">Email:</span>
              <span>{payment.user.email}</span>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push(`/admin/users/${payment.userId}`)}
              >
                <User className="h-4 w-4 mr-2" />
                Ver Perfil do Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {payment.proofImage && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Comprovante de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img 
                src={payment.proofImage} 
                alt="Comprovante de Pagamento" 
                className="max-w-full max-h-96 object-contain rounded-md shadow-md border" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-48 bg-gray-100 border rounded flex items-center justify-center text-gray-500">
                        <div class="text-center">
                          <p>Erro ao carregar comprovante</p>
                          <p class="text-xs mt-1">URL: ${payment.proofImage}</p>
                          <a href="${payment.proofImage}" target="_blank" class="text-blue-500 text-xs hover:underline mt-2 block">
                            Tentar abrir em nova aba
                          </a>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <a 
                href={payment.proofImage} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Abrir comprovante em nova aba
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {payment.status === "PENDING" && (
        <div className="flex justify-end space-x-4">
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={() => handleStatusChange("APPROVED")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Pagamento
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              const reason = prompt("Por favor, forneça um motivo para a rejeição:")
              if (reason) {
                handleStatusChange("REJECTED", reason)
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar Pagamento
          </Button>
        </div>
      )}
    </div>
  )
}