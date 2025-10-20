"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  MoreHorizontal, 
  Sparkles, 
  Shield, 
  Zap,
  Calendar,
  AlertTriangle,
  Users,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { formatDate as formatDateUtil } from "@/lib/date-utils"

// Prevent static generation
export const dynamic = 'force-dynamic'

interface DashboardStats {
  duesToday: {
    count: number
    amount: number
    items: any[]
  }
  duesThisWeek: {
    count: number
    amount: number
    items: any[]
  }
  duesThisMonth: {
    count: number
    amount: number
    items: any[]
  }
  overdue: {
    count: number
    amount: number
    items: any[]
  }
  totalReceivedThisMonth: number
  activeLoans: number
  uniqueCustomers: number
  defaultRate: number
  upcomingDues: any[]
}

export default function DashboardPage() {
  const sessionResult = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Handle undefined session during prerendering
  if (!sessionResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { data: session, status } = sessionResult

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats()
    }
  }, [session])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !session.user || !stats) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return formatDateUtil(dateString)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Premium */}
      <div className="dashboard-welcome relative overflow-hidden rounded-3xl credmar-gradient p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Dashboard de Gestão</h1>
          </div>
          <p className="text-red-100 text-lg mb-6">
            Bem-vindo de volta, <span className="font-semibold">{session.user.name || session.user.email}!</span>
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Sistema Online</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">{stats.activeLoans} Empréstimos Ativos</span>
            </div>
            <div className="text-sm text-red-100">
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principais - Agora com Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vencimentos Hoje - Clicável */}
        <Link href="/dashboard/vencimentos/hoje">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 hover:shadow-2xl transition-all duration-500 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-red-800">Vencimentos Hoje</CardTitle>
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-700 mb-2">
                {stats.duesToday.count}
              </div>
              <div className="text-sm text-red-600 mb-2">
                parcelas pendentes
              </div>
              <div className="flex items-center text-xs text-red-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>Clique para ver detalhes</span>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
          </Card>
        </Link>

        {/* Vencimentos da Semana - Clicável */}
        <Link href="/dashboard/vencimentos/semana">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 hover:shadow-2xl transition-all duration-500 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-amber-800">Esta Semana</CardTitle>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-amber-700 mb-2">
                {stats.duesThisWeek.count}
              </div>
              <div className="text-sm text-amber-600 mb-2">
                parcelas pendentes
              </div>
              <div className="flex items-center text-xs text-amber-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Clique para ver detalhes</span>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          </Card>
        </Link>

        {/* Em Atraso - Clicável */}
        <Link href="/dashboard/vencimentos/atraso">
          <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-red-50 via-red-50 to-red-100 hover:shadow-2xl transition-all duration-500 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-red-800">Em Atraso</CardTitle>
              <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-700 mb-2">
                {stats.overdue.count}
              </div>
              <div className="text-sm text-red-600 mb-2">
                parcelas em atraso
              </div>
              <div className="flex items-center text-xs text-red-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>Clique para ver detalhes</span>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-700"></div>
          </Card>
        </Link>

        {/* Recebido no Mês - Mantém sem link por enquanto */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 hover:shadow-2xl transition-all duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-emerald-800">Recebido no Mês</CardTitle>
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-700 mb-2">
              {formatCurrency(stats.totalReceivedThisMonth)}
            </div>
            <div className="text-sm text-emerald-600 mb-2">
              recebido este mês
            </div>
            <div className="flex items-center text-xs text-emerald-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>Performance mensal</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
        </Card>
      </div>

      {/* Próximos Vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">Próximos Vencimentos</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Parcelas que vencem nos próximos 7 dias
                </CardDescription>
              </div>
              <Link href="/dashboard/emprestimos">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats.upcomingDues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Tudo em dia!</h3>
                <p className="text-slate-500 max-w-md">
                  Não há vencimentos nos próximos 7 dias.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {stats.upcomingDues.map((installment) => (
                  <div key={installment.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {installment.loan.customer.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            Parcela {installment.installmentNumber} • {formatCurrency(installment.amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Vence em {formatDate(installment.dueDate)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-600">
                        {Math.ceil((new Date(installment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo de Performance */}
        <Card className="performance-section border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50">
            <CardTitle className="text-xl font-bold text-slate-800">Resumo de Performance</CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              Indicadores chave do seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-800">Clientes Ativos</p>
                    <p className="text-sm text-emerald-600">Base de clientes atual</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {stats.uniqueCustomers}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Empréstimos Ativos</p>
                    <p className="text-sm text-blue-600">Contratos em andamento</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.activeLoans}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Taxa de Inadimplência</p>
                    <p className="text-sm text-red-600">Percentual de atraso</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {stats.defaultRate}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/emprestimos">
          <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/10"></div>
            <CardHeader className="pb-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-600">GESTÃO</span>
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-purple-700 transition-colors mb-2">
                Gerenciar Empréstimos
              </CardTitle>
              <CardDescription className="text-slate-600 leading-relaxed">
                Visualize, edite e acompanhe todos os seus empréstimos e parcelas
              </CardDescription>
            </CardHeader>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </Card>
        </Link>

        <Link href="/dashboard/clientes">
          <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/10"></div>
            <CardHeader className="pb-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600">CLIENTES</span>
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors mb-2">
                Gerenciar Clientes
              </CardTitle>
              <CardDescription className="text-slate-600 leading-relaxed">
                Cadastre novos clientes e gerencie informações de contato
              </CardDescription>
            </CardHeader>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </Card>
        </Link>

        <Link href="/dashboard/emprestimos/novo">
          <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/10"></div>
            <CardHeader className="pb-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-r from-rose-500 to-red-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-semibold text-rose-600">NOVO</span>
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-rose-700 transition-colors mb-2">
                Novo Empréstimo
              </CardTitle>
              <CardDescription className="text-slate-600 leading-relaxed">
                Crie um novo empréstimo com parcelas personalizadas
              </CardDescription>
            </CardHeader>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </Card>
        </Link>
      </div>
    </div>
  )
}