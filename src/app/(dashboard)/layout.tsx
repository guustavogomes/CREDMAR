"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  CreditCard, 
  Settings, 
  LogOut, 
  User,
  Menu,
  Bell,
  Search,
  Users,
  DollarSign
} from "lucide-react"
import { useState } from "react"

// Prevent static generation
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionResult = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle undefined session during prerendering
  if (!sessionResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { data: session, status } = sessionResult

  // Adicione esta verificação no useEffect existente, logo após a verificação de autenticação
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    
    // Verificar status do usuário
    if (session?.user?.status === "PENDING_PAYMENT" || session?.user?.status === "PENDING_APPROVAL") {
      router.push("/pending-payment")
      return
    }
  }, [status, router, session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
    { name: 'Empréstimos', href: '/dashboard/emprestimos', icon: DollarSign },
    { name: 'Pagamentos', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 dark:from-background dark:via-muted/10 dark:to-muted/20">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${
        sidebarOpen ? 'block' : 'hidden'
      }`}>
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl">
          <div className="flex h-20 items-center justify-between px-6 bg-gradient-to-r from-primary to-primary/80">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-primary-foreground">TaPago</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
              <span className="sr-only">Fechar sidebar</span>
              ×
            </button>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-foreground hover:bg-muted hover:text-primary transition-all duration-200"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-background/80 backdrop-blur-xl border-r border-border shadow-xl">
          <div className="flex h-20 items-center px-6 bg-gradient-to-r from-primary to-primary/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-primary-foreground">TaPago</span>
            </div>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-foreground hover:bg-muted hover:text-primary transition-all duration-200 hover:shadow-md"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="flex items-center bg-muted/50 rounded-xl p-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-foreground">{session.user?.name || session.user?.email}</p>
                <p className="text-xs text-muted-foreground">{session.user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="ml-2 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 bg-background/80 backdrop-blur-xl border-b border-border px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-foreground lg:hidden hover:bg-muted rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </button>
              <div className="hidden sm:flex items-center">
                <span className="text-sm font-medium text-foreground">Olá, {session.user?.name || session.user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
