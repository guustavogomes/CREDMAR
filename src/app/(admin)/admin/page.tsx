"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  User, 
  Shield,
  Users,
  ShieldCheck,
  Calendar,
  UserPlus
} from "lucide-react"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    activeUsers: 0,
    suspendedUsers: 0,
    totalUsers: 0,
    totalLoans: 0
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Verificar se o usuário é um administrador
    // Verificar se o usuário é um administrador
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    // Carregar estatísticas
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      }
    }

    fetchStats()
  }, [session, status, router])

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
        <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-red-600" />
          <span className="text-sm font-medium">Modo Administrador</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Usuários cadastrados</p>
            <Button 
              size="sm" 
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => router.push("/dashboard/clientes")}
            >
              Ver Clientes
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Contas ativas</p>
            <Button 
              size="sm" 
              className="mt-4 w-full bg-green-500 hover:bg-green-600"
              onClick={() => router.push("/admin/users?filter=active")}
            >
              Visualizar
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Empréstimos</CardTitle>
            <CreditCard className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-slate-500 mt-1">Empréstimos cadastrados</p>
            <Button 
              size="sm" 
              className="mt-4 w-full bg-purple-500 hover:bg-purple-600"
              onClick={() => router.push("/dashboard/emprestimos")}
            >
              Ver Empréstimos
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuários Suspensos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.suspendedUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Contas suspensas</p>
            <Button 
              size="sm" 
              className="mt-4 w-full bg-red-500 hover:bg-red-600"
              onClick={() => router.push("/admin/users?filter=suspended")}
            >
              Gerenciar
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Gerenciamento de Clientes</CardTitle>
            <CardDescription>Cadastrar e gerenciar clientes do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => router.push("/dashboard/clientes")}
              >
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Clientes
              </Button>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={() => router.push("/dashboard/clientes/novo")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Cliente
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Gerenciamento de Empréstimos</CardTitle>
            <CardDescription>Criar e acompanhar empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={() => router.push("/dashboard/emprestimos")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Gerenciar Empréstimos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Configurar Periodicidades</CardTitle>
            <CardDescription>Gerenciar regras de vencimento dos empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={() => router.push("/admin/periodicities")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Gerenciar Periodicidades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
