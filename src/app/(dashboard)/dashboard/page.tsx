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
  XCircle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Wallet,
  CreditCard as CreditCardIcon,
  Hand,
  Banknote,
  Calculator,
  ChevronRight,
  Star,
  Award,
  Briefcase
} from "lucide-react"
import Link from "next/link"
import { formatDate as formatDateUtil } from "@/lib/date-utils"
import { HeroSection } from "@/components/dashboard/hero-section"
import { RealTimeStats } from "@/components/dashboard/real-time-stats"
import { NotificationWidget } from "@/components/dashboard/notification-widget"

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
      {/* Hero Section Redesenhado */}
      <HeroSection 
        userName={session.user.name || session.user.email || "Usuário"}
        stats={stats}
      />

      {/* Estatísticas em Tempo Real */}
      <RealTimeStats stats={stats} />

      {/* Métricas Principais Redesenhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Vencimentos Hoje */}
        <Link href="/dashboard/vencimentos/hoje">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/10"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10"></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">
                  Hoje
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-800 mt-4">
                Vencimentos
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-red-600">
                  {stats.duesToday.count}
                </div>
                <p className="text-sm text-slate-600">
                  parcelas vencem hoje
                </p>
                <div className="flex items-center text-xs text-red-500 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Ver detalhes</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>

        {/* Vencimentos da Semana */}
        <Link href="/dashboard/vencimentos/semana">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/10"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10"></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50">
                  7 dias
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-800 mt-4">
                Esta Semana
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-amber-600">
                  {stats.duesThisWeek.count}
                </div>
                <p className="text-sm text-slate-600">
                  parcelas pendentes
                </p>
                <div className="flex items-center text-xs text-amber-500 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Ver detalhes</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>

        {/* Em Atraso */}
        <Link href="/dashboard/vencimentos/atraso">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-red-600/10"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/10 rounded-full -mr-10 -mt-10"></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                  Atraso
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-slate-800 mt-4">
                Em Atraso
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-red-700">
                  {stats.overdue.count}
                </div>
                <p className="text-sm text-slate-600">
                  parcelas atrasadas
                </p>
                <div className="flex items-center text-xs text-red-600 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Ação necessária</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>

        {/* Recebido no Mês */}
        <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
          
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50">
                Mês atual
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-slate-800 mt-4">
              Recebido
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.totalReceivedThisMonth)}
              </div>
              <p className="text-sm text-slate-600">
                recebido este mês
              </p>
              <div className="flex items-center text-xs text-emerald-500 pt-2">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>Performance mensal</span>
              </div>
            </div>
          </CardContent>
          
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </Card>
      </div>

      {/* Seção de Análise e Vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Vencimentos - 2/3 da largura */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white h-full">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800">Agenda de Vencimentos</CardTitle>
                    <CardDescription className="text-slate-600 mt-1">
                      Próximas parcelas a vencer
                    </CardDescription>
                  </div>
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">Agenda Limpa!</h3>
                  <p className="text-slate-500 max-w-md leading-relaxed">
                    Não há vencimentos programados para os próximos 7 dias. Seu negócio está em dia!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {stats.upcomingDues.map((installment, index) => (
                    <div key={installment.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                              <Banknote className="h-5 w-5 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800 text-lg">
                              {installment.loan.customer.name}
                            </p>
                            <div className="flex items-center space-x-3 text-sm text-slate-600">
                              <span>Parcela {installment.installmentNumber}</span>
                              <span>•</span>
                              <span className="font-medium text-blue-600">{formatCurrency(installment.amount)}</span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Vence em {formatDate(installment.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">
                            {Math.ceil((new Date(installment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Indicadores de Performance - 1/3 da largura */}
        <div className="space-y-6">
          {/* Widget de Notificações */}
          <NotificationWidget stats={stats} />

          {/* KPIs Principais */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">KPIs</CardTitle>
                  <CardDescription className="text-slate-600">
                    Indicadores principais
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Clientes</span>
                  </div>
                  <Star className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-700">
                  {stats.uniqueCustomers}
                </div>
                <p className="text-xs text-emerald-600 mt-1">Base ativa</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Contratos</span>
                  </div>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.activeLoans}
                </div>
                <p className="text-xs text-blue-600 mt-1">Em andamento</p>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Inadimplência</span>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {stats.defaultRate}%
                </div>
                <p className="text-xs text-red-600 mt-1">Taxa atual</p>
              </div>
            </CardContent>
          </Card>

          {/* Status do Sistema */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Sistema Operacional</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Todos os serviços funcionando normalmente
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Online • Atualizado em tempo real</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Rápidas Redesenhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Novo Empréstimo */}
        <Link href="/dashboard/emprestimos/novo">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-12 -mt-12"></div>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    Novo
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                    Criar Empréstimo
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Cadastre um novo empréstimo com simulação automática
                  </p>
                </div>
                
                <div className="flex items-center text-xs text-red-500 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Começar agora</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>

        {/* Simulação */}
        <Link href="/dashboard/simulacao">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12"></div>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    Calcular
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Simulação
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Simule empréstimos com diferentes tipos de juros
                  </p>
                </div>
                
                <div className="flex items-center text-xs text-blue-500 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Simular agora</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>

        {/* Gerenciar Empréstimos */}
        <Link href="/dashboard/emprestimos">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12"></div>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                    Gestão
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    Empréstimos
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Visualize e gerencie todos os contratos ativos
                  </p>
                </div>
                
                <div className="flex items-center text-xs text-indigo-500 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Ver contratos</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>

        {/* Gerenciar Clientes */}
        <Link href="/dashboard/clientes">
          <Card className="group relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12"></div>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    Clientes
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Base de Clientes
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Cadastre e gerencie informações dos clientes
                  </p>
                </div>
                
                <div className="flex items-center text-xs text-emerald-500 pt-2">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>Ver clientes</span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </Card>
        </Link>
      </div>

      {/* Seção de Insights Avançados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo Mensal */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Resumo do Mês</CardTitle>
                <CardDescription className="text-slate-600">
                  Análise de performance mensal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {formatCurrency(stats.totalReceivedThisMonth)}
                </div>
                <p className="text-sm text-slate-600">Recebido</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Hand className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.duesThisMonth.count}
                </div>
                <p className="text-sm text-slate-600">Vencimentos</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Performance geral</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-emerald-600 font-medium">Excelente</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Recomendadas */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Ações Recomendadas</CardTitle>
                <CardDescription className="text-slate-600">
                  Sugestões para otimizar seu negócio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats.overdue.count > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 mb-1">Cobranças Pendentes</h4>
                    <p className="text-sm text-red-600 mb-2">
                      {stats.overdue.count} parcelas em atraso precisam de atenção
                    </p>
                    <Link href="/dashboard/vencimentos/atraso">
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 mb-1">Nova Simulação</h4>
                  <p className="text-sm text-blue-600 mb-2">
                    Crie simulações para novos clientes interessados
                  </p>
                  <Link href="/dashboard/simulacao">
                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                      Simular Agora
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="p-2 bg-emerald-500 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-800 mb-1">Expandir Base</h4>
                  <p className="text-sm text-emerald-600 mb-2">
                    Cadastre novos clientes para aumentar seu portfólio
                  </p>
                  <Link href="/dashboard/clientes">
                    <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                      Gerenciar Clientes
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}