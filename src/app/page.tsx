'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Upload, AlertTriangle, Copy, Check, ArrowRight, CheckCircle, Brain, Shield, Users, Zap, Star, TrendingDown, Globe, Lock, Smartphone, BarChart3, Quote, Server, Database, Clock, Cloud, HardDrive, Activity } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight px-2 sm:px-0">
              <span className="block sm:inline">Gestão de</span>
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Empréstimos
              </span>
              <span className="block text-slate-700">Inteligente</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
              Revolucione sua gestão de empréstimos com nosso termômetro anti-fraude baseado em IA. 
              Reduza significativamente a inadimplência e maximize seus resultados.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-2 sm:px-0">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg" asChild>
                <Link href="/register">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-300 hover:border-blue-300 hover:bg-blue-50 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg" asChild>
                <Link href="/login">Já sou cliente</Link>
              </Button>
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

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.000+</div>
              <div className="text-slate-600">Usuários ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">-65%</div>
              <div className="text-slate-600">Redução inadimplência</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">98.7%</div>
              <div className="text-slate-600">Precisão da IA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">R$ 50M+</div>
              <div className="text-slate-600">Empréstimos analisados</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Premium */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Tecnologia que
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                revoluciona empréstimos
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Nossa IA analisa centenas de variáveis em tempo real para identificar riscos e prevenir fraudes
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
                  Termômetro Anti-Fraude
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-slate-600 leading-relaxed">
                  IA avançada que analisa padrões comportamentais e dados históricos 
                  para detectar tentativas de fraude em tempo real.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">98.7% Precisão</span>
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
                  Redução da Inadimplência
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-slate-600 leading-relaxed">
                  Algoritmos preditivos que identificam clientes com maior probabilidade 
                  de inadimplência antes mesmo da aprovação.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">-65% Inadimplência</span>
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
                  Análise Instantânea
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 text-center">
                <CardDescription className="text-slate-600 leading-relaxed">
                  Decisões de crédito em segundos com base em centenas de variáveis 
                  analisadas simultaneamente pela nossa IA.
                </CardDescription>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">&lt; 3 segundos</span>
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
              Veja como nossas financeiras parceiras reduziram drasticamente a inadimplência
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
                    <h3 className="font-bold text-slate-800">FinanCred</h3>
                    <p className="text-sm text-slate-600">Financeira Digital</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-blue-500 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-4">
                  "Com o TaPago, reduzimos nossa inadimplência de 18% para apenas 6% em 8 meses. 
                  O termômetro anti-fraude é impressionante!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Maria Silva, CEO</span>
                  <div className="text-2xl font-bold text-green-600">-67%</div>
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
                    <h3 className="font-bold text-slate-800">CréditoClaro</h3>
                    <p className="text-sm text-slate-600">Microcrédito</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-emerald-500 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-4">
                  "A IA do TaPago identificou padrões que nunca conseguimos detectar. 
                  Nossa carteira nunca esteve tão saudável!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">João Santos, Diretor</span>
                  <div className="text-2xl font-bold text-green-600">-72%</div>
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
                    <h3 className="font-bold text-slate-800">RápidoFin</h3>
                    <p className="text-sm text-slate-600">Empréstimos Online</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-purple-500 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed mb-4">
                  "Em 6 meses, nossa inadimplência caiu de 22% para 8%. 
                  O ROI foi incrível, recomendo para todas as financeiras!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Ana Costa, CFO</span>
                  <div className="text-2xl font-bold text-green-600">-64%</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mt-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mb-48"></div>
        
        <div className="container mx-auto px-6 sm:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para reduzir sua
            <span className="block">inadimplência em 65%?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 2.000 usuários que já transformaram sua gestão de empréstimos com nossa IA
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg font-semibold" asChild>
              <Link href="/register">
                Assinar por R$100,00/mês
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-blue-400 bg-blue-500/20 text-white hover:bg-blue-500/30 hover:border-blue-300 px-8 py-4 text-lg" asChild>
              <Link href="/login">Fazer Login</Link>
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            Plano completo • Todos os benefícios • 1 usuário • Suporte especializado
          </p>
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
              A plataforma de gestão de empréstimos mais inteligente do Brasil.
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
                A plataforma de gestão de empréstimos mais inteligente do Brasil.
              </p>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-3 text-white">Produto</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors block py-1">IA Anti-Fraude</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Análise de Risco</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors block py-1">API</Link></li>
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
    </div>
  )
}