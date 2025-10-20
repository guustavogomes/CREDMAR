"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Fazendo login automático...",
        })
        
        // Fazer login automático após registro
        const signInResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })
        
        
        if (signInResult?.ok && !signInResult.error) {
          // Aguardar um pouco para a sessão ser estabelecida
          setTimeout(() => {
            router.push("/dashboard")
          }, 1000)
        } else {
          toast({
            title: "Conta criada!",
            description: "Faça login para continuar.",
          })
          router.push("/login")
        }
      } else {
        const data = await response.json()
        toast({
          title: "Erro no registro",
          description: data.error || "Algo deu errado.",
          variant: "destructive",
        })
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
    <div className="min-h-screen flex items-center justify-center credmar-gradient px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-credmar-red to-credmar-red-dark rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <CardTitle className="text-3xl font-bold text-credmar-blue">CREDMAR</CardTitle>
          </div>
          <CardDescription className="text-center text-credmar-blue-light">
            Seu crédito, sua força
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-credmar-red hover:text-credmar-red-dark hover:underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}