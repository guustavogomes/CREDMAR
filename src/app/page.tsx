import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Shield, Users, Zap, ArrowRight, CheckCircle, Star, TrendingDown, Globe, Lock, Smartphone, BarChart3, Quote } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Premium */}
      <header className="relative bg-white border-b border-slate-100 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TaPago</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg" asChild>
                <Link href="/register">Começar Agora</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section Premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -ml-48 -mt-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-400/20 to-transparent rounded-full -mr-48 -mb-48"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 shadow-lg">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Powered by Mercury Enterprise</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
              Gestão de
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Empréstimos
              </span>
              <span className="block text-slate-700">Inteligente</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Revolucione sua gestão de empréstimos com nosso termômetro anti-fraude baseado em IA. 
              Reduza significativamente a inadimplência e maximize seus resultados.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl px-8 py-4 text-lg" asChild>
                <Link href="/register">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-slate-300 hover:border-blue-300 hover:bg-blue-50 px-8 py-4 text-lg" asChild>
                <Link href="/login">Já sou cliente</Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 pt-8 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>+2.000 usuários ativos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>IA anti-fraude</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
        <div className="container mx-auto px-6">
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

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
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
        
        <div className="container mx-auto px-6 text-center relative z-10">
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
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
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
            
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">IA Anti-Fraude</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Análise de Risco</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">Sobre</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Carreiras</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cases</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contato</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentação</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Treinamentos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Segurança</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">
              &copy; 2024 TaPago. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacidade</Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Termos</Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}