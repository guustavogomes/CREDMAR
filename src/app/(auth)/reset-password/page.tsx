"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')
  const { toast } = useToast()

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !resetCode) {
      toast({
        title: "Erro",
        description: "Email e código são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          resetCode, 
          password 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetComplete(true)
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi alterada com sucesso.",
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao redefinir senha.",
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



  // Success state
  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center credmar-gradient px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Senha Redefinida!</CardTitle>
            <CardDescription className="text-credmar-blue-light">
              Sua senha foi alterada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="block">
              <Button className="w-full credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold">
                Fazer Login
              </Button>
            </Link>
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
          <CardTitle className="text-xl font-bold text-center text-credmar-blue">Nova Senha</CardTitle>
          <CardDescription className="text-center text-credmar-blue-light">
            Digite o código de recuperação e sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Código de recuperação (6 dígitos)"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="text-center text-2xl font-bold tracking-wider"
              />
              <p className="text-xs text-credmar-blue-light text-center">
                Digite o código de 6 dígitos que você recebeu
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {password && (
              <div className="text-xs text-credmar-blue-light">
                <p className={password.length >= 6 ? "text-green-600" : "text-credmar-red"}>
                  • Mínimo 6 caracteres
                </p>
                {confirmPassword && (
                  <p className={password === confirmPassword ? "text-green-600" : "text-credmar-red"}>
                    • Senhas {password === confirmPassword ? "coincidem" : "não coincidem"}
                  </p>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold" 
              disabled={isLoading || password !== confirmPassword || password.length < 6 || !email || !resetCode}
            >
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-credmar-red hover:text-credmar-red-dark hover:underline block">
              Gerar novo código
            </Link>
            <Link href="/login" className="text-sm text-credmar-blue-light hover:text-credmar-blue hover:underline inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}