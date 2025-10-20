"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resetCode, setResetCode] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        setResetCode(data.resetCode || "")
        toast({
          title: "Código gerado!",
          description: "Use o código exibido para redefinir sua senha.",
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao gerar código de recuperação.",
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

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center credmar-gradient px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-credmar-blue">Código Gerado!</CardTitle>
            <CardDescription className="text-credmar-blue-light">
              Use este código para redefinir sua senha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Código de Recuperação */}
            <div className="bg-credmar-red/10 border-2 border-credmar-red/20 rounded-xl p-6 text-center">
              <p className="text-sm text-credmar-blue mb-2">Seu código de recuperação:</p>
              <div className="text-4xl font-bold text-credmar-red mb-2 tracking-wider">
                {resetCode}
              </div>
              <p className="text-xs text-credmar-blue-light">
                Este código expira em 1 hora
              </p>
            </div>
            
            <div className="text-sm text-credmar-blue-light text-center space-y-2">
              <p>• Anote este código em local seguro</p>
              <p>• Use na página de redefinição de senha</p>
              <p>• Não compartilhe com ninguém</p>
            </div>
            
            <div className="space-y-2">
              <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="block">
                <Button className="w-full credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold">
                  Redefinir Senha Agora
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                  setResetCode("")
                }} 
                variant="outline" 
                className="w-full border-credmar-blue/20 text-credmar-blue hover:bg-credmar-blue/5"
              >
                Gerar novo código
              </Button>
              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full text-credmar-blue-light hover:text-credmar-blue">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardTitle className="text-xl font-bold text-center text-credmar-blue">Recuperar Senha</CardTitle>
          <CardDescription className="text-center text-credmar-blue-light">
            Digite seu email para gerar um código de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold" disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Código de Recuperação"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-credmar-red hover:text-credmar-red-dark hover:underline inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}