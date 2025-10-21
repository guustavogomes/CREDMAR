"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  Activity, 
  FileText, 
  Award, 
  Sparkles,
  Shield,
  Clock
} from "lucide-react"

interface HeroSectionProps {
  userName: string
  stats: {
    activeLoans: number
    totalReceivedThisMonth: number
    uniqueCustomers: number
    defaultRate: number
  }
}

export function HeroSection({ userName, stats }: HeroSectionProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white shadow-2xl transition-all duration-1000 ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}>
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/20 to-transparent rounded-full -mr-48 -mt-48 blur-3xl animate-pulse-soft"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full -ml-40 -mb-40 blur-3xl animate-pulse-soft"></div>
      
      {/* Partículas flutuantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Lado esquerdo - Informações principais */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg animate-pulse-soft">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent">
                  CREDMAR
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  Central de Gestão Financeira
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <p className="text-xl text-blue-50">
                  {getGreeting()}, <span className="font-bold text-white">{userName}!</span>
                </p>
              </div>
              <p className="text-blue-200 leading-relaxed">
                Bem-vindo ao seu painel de controle. Aqui você tem uma visão completa do seu negócio em tempo real.
              </p>
            </div>

            {/* Status indicators */}
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>Sistema Online</span>
                </div>
              </Badge>
              
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 px-3 py-1">
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3" />
                  <span>Dados Seguros</span>
                </div>
              </Badge>
              
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>{currentTime.toLocaleTimeString('pt-BR')}</span>
                </div>
              </Badge>
            </div>
          </div>

          {/* Lado direito - Métricas rápidas */}
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Visão Geral</h3>
                <Award className="h-6 w-6 text-yellow-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-blue-300" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats.activeLoans}
                  </div>
                  <p className="text-xs text-blue-200">Contratos Ativos</p>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats.uniqueCustomers}
                  </div>
                  <p className="text-xs text-blue-200">Clientes Ativos</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">Faturamento Mensal</span>
                  <span className="font-bold text-emerald-300 text-lg">
                    {formatCurrency(stats.totalReceivedThisMonth)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-blue-300/80">
                Dados atualizados em tempo real • Última sincronização: agora
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}