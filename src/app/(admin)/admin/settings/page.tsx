"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Lock, 
  User,
  Palette
} from "lucide-react"

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Senha alterada com sucesso.",
        })
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao alterar senha.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno do servidor.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-600">Gerencie suas preferências e configurações da conta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Usuário */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Informações da Conta</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Nome</Label>
              <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                <span className="text-slate-800">{session?.user?.name || "Não informado"}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-700">Email</Label>
              <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                <span className="text-slate-800">{session?.user?.email}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-700">Função</Label>
              <div className="mt-1 p-3 bg-slate-50 rounded-lg border">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Administrador
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tema da Aplicação */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800">Aparência</h2>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Tema da aplicação</Label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      theme === option.value
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-2" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Alterar Senha */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg lg:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-800">Alterar Senha</h2>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                  Senha Atual
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                  Nova Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1"
                  minLength={6}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white"
              >
                {isChangingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}