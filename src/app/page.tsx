'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Upload, AlertTriangle, Copy, Check, ArrowRight, CheckCircle, Brain, Shield, Users, Zap, Star, TrendingDown, Globe, Lock, Smartphone, BarChart3, Quote, Server, Database, Clock, Cloud, HardDrive, Activity, MessageCircle } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  })

  // Se o usuário estiver autenticado, redirecionar conforme o role
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  // Timer de contagem regressiva
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime.seconds > 0) {
          return { ...prevTime, seconds: prevTime.seconds - 1 }
        } else if (prevTime.minutes > 0) {
          return { ...prevTime, minutes: prevTime.minutes - 1, seconds: 59 }
        } else if (prevTime.hours > 0) {
          return { hours: prevTime.hours - 1, minutes: 59, seconds: 59 }
        } else {
          // Reset timer when it reaches 0
          return { hours: 23, minutes: 59, seconds: 59 }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleWhatsAppSupport = () => {
    const phoneNumber = '551231974950' // Número com código do país (55) + DDD (12) + número
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre o TaPago e como posso organizar meus empréstimos informais!')
    const url = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(url, '_blank')
  }

  // Se ainda está carregando, mostrar loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Landing page para usuários não autenticados
  return (
    <div className="min-h-screen bg-white">
      {/* Banner de Escassez - Mobile Optimized */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white py-2 sm:py-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-sm sm:text-base font-bold">OFERTA LIMITADA</span>
            </div>
            <span className="text-sm sm:text-base">🔥 Apenas R$ 29,99/mês - Preço promocional por tempo limitado!</span>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <span className="text-xs sm:text-sm font-semibold">⏰ Restam apenas 47 vagas!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Premium - Mobile Optimized */}
      <header className="bg-white border-b border-slate-100 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 sm:px-8 py-3 sm:py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">T</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TaPago</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 sm:px-4" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg px-3 sm:px-4" asChild>
                <Link href="/register">
                  <span className="hidden sm:inline">Começar Agora</span>
                  <span className="sm:hidden">Começar</span>
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section Premium - Mobile Optimized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -ml-32 -mt-32 sm:-ml-48 sm:-mt-48"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-tl from-indigo-400/20 to-transparent rounded-full -mr-32 -mb-32 sm:-mr-48 sm:-mb-48"></div>
        </div>
        
        <div className="container mx-auto px-6 sm:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            
            {/* Badge de Preço Promocional */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full text-sm sm:text-base font-bold shadow-lg animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span>🎉 PREÇO PROMOCIONAL: R$ 29,99/mês</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">-70% OFF</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight px-2 sm:px-0">
              <span className="block sm:inline">Organize seus</span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Empréstimos
              </span>
              <span className="block text-slate-700">Informais</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
              <span className="font-bold text-red-600">⚠️ ATENÇÃO:</span> Controle total dos seus empréstimos pessoais com amigos, familiares e conhecidos. 
              <span className="font-semibold text-slate-800">Oferta válida apenas para os próximos 47 clientes!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-2 sm:px-0">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold animate-pulse" asChild>
                <Link href="/register">
                  🚀 GARANTIR VAGA - R$ 29,99/mês
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-300 hover:border-blue-300 hover:bg-blue-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg" asChild>
                <Link href="/login">Já sou cliente</Link>
              </Button>
            </div>
            
            {/* Timer de Contagem Regressiva */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-red-700 mb-3">⏰ OFERTA EXPIRA EM:</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 shadow-md">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-xs sm:text-sm text-slate-600">Horas</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-md">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-xs sm:text-sm text-slate-600">Minutos</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-md">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-xs sm:text-sm text-slate-600">Segundos</div>
                  </div>
                </div>
                <p className="text-sm text-red-600 font-semibold">🔥 Apenas 47 vagas restantes pelo preço promocional!</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-slate-500 px-2 sm:px-0">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>+2.000 usuários ativos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>IA anti-fraude</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section com Urgência */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 sm:px-8">
          {/* Banner de Urgência */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full text-sm sm:text-base font-bold shadow-lg mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span>🚨 ÚLTIMAS VAGAS: Apenas 47 clientes podem aproveitar R$ 29,99/mês!</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Resultados que <span className="text-red-600">comprovam</span> nossa eficácia
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Veja os números impressionantes de quem já organizou seus empréstimos informais
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.000+</div>
              <div className="text-slate-600">Usuários ativos</div>
              <div className="text-xs text-green-600 font-semibold mt-2">+300 este mês!</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100">
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-slate-600">Organização completa</div>
              <div className="text-xs text-green-600 font-semibold mt-2">Controle total</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
              <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-slate-600">Segurança garantida</div>
              <div className="text-xs text-green-600 font-semibold mt-2">Dados protegidos</div>
            </div>
            <div className="text-center bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">R$ 2M+</div>
              <div className="text-slate-600">Empréstimos organizados</div>
              <div className="text-xs text-green-600 font-semibold mt-2">Por nossos usuários</div>
            </div>
          </div>
          
          {/* Call to Action Urgente */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">⚡ Não perca esta oportunidade!</h3>
              <p className="text-lg mb-6 text-red-100">
                Apenas <span className="font-bold text-white">47 vagas restantes</span> pelo preço promocional de R$ 29,99/mês para organizar seus empréstimos. 
                Após isso, o valor volta para R$ 99,90/mês!
              </p>
              <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 shadow-xl px-8 py-4 text-lg font-bold" asChild>
                <Link href="/register">
                  🚀 GARANTIR MINHA VAGA AGORA - R$ 29,99/mês
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Premium */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Ferramentas que
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                organizam seus empréstimos
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Controle total dos seus empréstimos informais com amigos, familiares e conhecidos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  Controle Total
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-slate-600 leading-relaxed">
                  Organize todos os seus empréstimos em um só lugar. Controle prazos, 
                  valores e status de cada empréstimo com amigos e familiares.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">100% Organizado</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  Lembretes Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-slate-600 leading-relaxed">
                  Nunca mais esqueça de cobrar ou pagar. Receba lembretes automáticos 
                  sobre vencimentos e prazos dos seus empréstimos.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">100% Lembretes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                  Relatórios Detalhados
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-slate-600 leading-relaxed">
                  Acompanhe o histórico completo dos seus empréstimos com relatórios 
                  detalhados e gráficos de fácil compreensão.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">Relatórios Completos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Reliability Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full -ml-48 -mt-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mb-48"></div>
        </div>
        
        <div className="container mx-auto px-6 sm:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Seus dados estão
              <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                100% seguros conosco
              </span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Investimos em infraestrutura de ponta para garantir que seus dados nunca sejam perdidos e sua operação nunca pare. 
              Nossa plataforma é construída com as melhores práticas de segurança do mercado.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <Card className="group relative overflow-hidden border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Cloud className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  Infraestrutura em Nuvem
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-blue-100 leading-relaxed">
                  Hospedado na Vercel com infraestrutura global. Seus dados ficam seguros com alta disponibilidade e performance otimizada.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">99.9% Uptime</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <HardDrive className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Backup Automático
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-blue-100 leading-relaxed">
                  Backup automático a cada 6 horas em 3 localizações diferentes. Seus dados nunca são perdidos, mesmo em situações extremas.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">3x Redundância</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  Disponibilidade 24x7
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-blue-100 leading-relaxed">
                  Monitoramento contínuo 24 horas por dia. Nossa equipe técnica está sempre alerta para garantir que sua operação nunca pare.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Globe className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">24/7 Monitoramento</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                  Segurança Avançada
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-blue-100 leading-relaxed">
                  Criptografia SSL 256-bit, autenticação de dois fatores e compliance total com a LGPD. Seus dados são protegidos como em um banco.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Lock className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400">LGPD Compliant</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Server className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Escalabilidade Automática
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-blue-100 leading-relaxed">
                  Nossa infraestrutura se adapta automaticamente ao seu crescimento. Não importa quantos clientes você tenha, sempre terá performance máxima.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">Auto Scaling</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                  Suporte Especializado
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-blue-100 leading-relaxed">
                  Equipe técnica especializada disponível 24/7. Em caso de qualquer dúvida ou problema, você tem suporte imediato e personalizado.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400">Suporte 24/7</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-200">Uptime Garantido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">&lt; 1s</div>
              <div className="text-blue-200">Tempo de Resposta</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">256-bit</div>
              <div className="text-blue-200">Criptografia SSL</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">0</div>
              <div className="text-blue-200">Perda de Dados</div>
            </div>
          </div>

          {/* Additional Security Features */}
          <div className="mt-16 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Por que escolher nossa plataforma?
              </h3>
              <p className="text-blue-100 max-w-2xl mx-auto">
                Nossa infraestrutura foi projetada pensando na segurança e confiabilidade que sua empresa precisa
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Backup em Tempo Real</h4>
                    <p className="text-blue-100 text-sm">Seus dados são salvos automaticamente a cada transação, garantindo que nada seja perdido</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Recuperação Instantânea</h4>
                    <p className="text-blue-100 text-sm">Em caso de falha, sua operação volta ao normal em menos de 1 minuto</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Monitoramento Proativo</h4>
                    <p className="text-blue-100 text-sm">Detectamos e resolvemos problemas antes que afetem sua operação</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Certificações de Segurança</h4>
                    <p className="text-blue-100 text-sm">Compliance total com LGPD e certificações internacionais de segurança</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Auditoria Contínua</h4>
                    <p className="text-blue-100 text-sm">Nossos sistemas passam por auditorias regulares de segurança</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Atualizações Automáticas</h4>
                    <p className="text-blue-100 text-sm">Sempre com as últimas tecnologias e correções de segurança</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 border border-white/20">
              <Shield className="h-6 w-6 text-green-400" />
              <span className="text-white font-semibold">Seus dados estão 100% protegidos</span>
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Resultados que
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                falam por si só
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Veja como nossos usuários organizaram seus empréstimos informais
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">FC</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Maria Silva</h3>
                    <p className="text-sm text-slate-600">Pessoa Física</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-blue-500 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-4">
                  "Finalmente consegui organizar todos os empréstimos que fiz para amigos e familiares. 
                  Agora sei exatamente quem deve quanto e quando!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Maria Silva, Usuária</span>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">CC</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">João Santos</h3>
                    <p className="text-sm text-slate-600">Pequeno Emprestador</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-emerald-500 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-4">
                  "Como faço empréstimos pessoais, precisava de uma ferramenta para organizar tudo. 
                  O TaPago me deu o controle total que precisava!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">João Santos, Emprestador</span>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">RF</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Ana Costa</h3>
                    <p className="text-sm text-slate-600">Associação de Crédito</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-purple-500 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-4">
                  "Nossa associação de crédito solidário precisava de organização. 
                  O TaPago nos deu a estrutura que precisávamos sem custos altos!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Ana Costa, Coordenadora</span>
                  <div className="text-2xl font-bold text-green-600">100%</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section Ultra Persuasiva */}
      <section className="py-20 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mb-48 animate-pulse"></div>
        
        <div className="container mx-auto px-6 sm:px-8 text-center relative z-10">
          {/* Banner de Urgência Máxima */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 bg-white text-red-600 px-8 py-4 rounded-full text-lg font-bold mb-6 animate-bounce shadow-2xl">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
              </span>
              🚨 ÚLTIMA CHANCE: Apenas 47 vagas restantes!
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="block">⚠️ ATENÇÃO:</span>
            <span className="block text-yellow-300">ÚLTIMA OPORTUNIDADE</span>
            <span className="block">para organizar seus empréstimos!</span>
          </h2>
          
          <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto font-semibold">
            🔥 <span className="text-yellow-300 font-bold">APENAS R$ 29,99/mês</span> - Preço promocional que expira em breve! 
            <br />Após as 47 vagas, o valor volta para <span className="line-through text-white">R$ 99,90/mês</span>
          </p>
          
          {/* Comparação de Preços */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-2xl mx-auto border-2 border-white/20">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300 mb-2">R$ 29,99</div>
                <div className="text-white font-semibold">Preço Promocional</div>
                <div className="text-orange-200 text-sm">🔥 Apenas 47 vagas!</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-300 mb-2 line-through">R$ 99,90</div>
                <div className="text-white font-semibold">Preço Normal</div>
                <div className="text-orange-200 text-sm">Após esgotar vagas</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 shadow-2xl px-12 py-6 text-xl font-bold animate-pulse border-4 border-yellow-300" asChild>
              <Link href="/register">
                🚀 GARANTIR VAGA AGORA - R$ 29,99/mês
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-3 border-white bg-white/20 text-white hover:bg-white/30 hover:border-white px-8 py-4 text-lg font-semibold" asChild>
              <Link href="/login">Já sou cliente</Link>
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border-2 border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">✅ O que você recebe por apenas R$ 29,99/mês:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Controle total dos seus empréstimos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Lembretes automáticos de vencimento</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Dashboard completo de organização</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Suporte especializado 24/7</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Relatórios detalhados e gráficos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Histórico completo de transações</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Interface simples e intuitiva</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">Garantia de 30 dias</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-lg text-yellow-200 font-bold mb-2">
              ⏰ OFERTA EXPIRA EM BREVE - Não perca esta oportunidade única!
            </p>
            <p className="text-sm text-orange-200">
              🔥 Apenas R$ 29,99/mês • Últimas 47 vagas • Garantia de 30 dias • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="bg-slate-900 text-white py-8 md:py-12">
        <div className="container mx-auto px-6 sm:px-8">
          {/* Logo e descrição - Mobile First */}
          <div className="mb-8 md:hidden">
            <div className="flex items-center space-x-3 mb-4 justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-2xl font-bold">TaPago</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed text-center px-4">
              A plataforma de organização de empréstimos informais mais completa do Brasil.
            </p>
          </div>

          {/* Grid de links - Responsivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {/* Logo para Desktop */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="text-xl font-bold">TaPago</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                A plataforma de organização de empréstimos informais mais completa do Brasil.
              </p>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-3 text-white">Produto</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Controle Total</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Lembretes Automáticos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Relatórios</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Organização</Link></li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-3 text-white">Empresa</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Sobre</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Carreiras</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Cases</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Contato</Link></li>
              </ul>
            </div>
            
            <div className="col-span-2 md:col-span-1 text-center md:text-left">
              <h3 className="font-semibold mb-3 text-white">Suporte</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Central de Ajuda</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Documentação</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Treinamentos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Segurança</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright e Links Legais */}
          <div className="border-t border-slate-800 pt-6 md:pt-8">
            <div className="flex flex-col items-center space-y-4 md:space-y-0 md:flex-row md:justify-between">
              <p className="text-slate-400 text-sm text-center md:text-left">
                &copy; 2024 TaPago. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-6">
                <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm py-2 md:py-0">Privacidade</Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm py-2 md:py-0">Termos</Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm py-2 md:py-0">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Botão Flutuante WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={handleWhatsAppSupport}
          className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 p-0"
          aria-label="Suporte via WhatsApp"
        >
          <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />
        </Button>
        {/* Tooltip sempre visível */}
        <div className="absolute -top-16 right-0 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3 w-3" />
            <span>Dúvidas? Chame no WhatsApp!</span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    </div>
  )
}