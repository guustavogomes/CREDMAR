"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        const isApprovalPending = result.error.includes('aprovada')
        const errorMessage = isApprovalPending 
          ? "Sua conta será aprovada em instantes. Você receberá um email de confirmação quando estiver liberada." 
          : "Email ou senha incorretos."
        
        toast({
          title: isApprovalPending ? "Conta pendente de aprovação" : "Erro no login",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        })
        
        // Verificar o papel do usuário e redirecionar adequadamente
        const session = await fetch("/api/auth/session")
        const sessionData = await session.json()
        
        if (sessionData?.user?.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">TaPago</CardTitle>
          <CardDescription className="text-center">
            Entre na sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <div>
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <div>
              Não tem uma conta?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Registre-se
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}