"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ArrowLeft, 
  UserPlus, 
  Shield, 
  User,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function NovoUsuarioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    status: 'ACTIVE'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validações
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Usuário cadastrado com sucesso!'
        })
        router.push('/admin/users')
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao cadastrar usuário',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar usuário',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Verificar se o usuário é um administrador
  if (session?.user?.role !== "ADMIN") {
    router.push("/dashboard")
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Cadastrar Novo Usuário</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-green-600" />
                Dados do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite o nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite a senha"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme a senha"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Usuário
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Administrador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Ativo
                          </div>
                        </SelectItem>
                        <SelectItem value="PENDING_APPROVAL">
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-2 text-amber-500" />
                            Aguardando Aprovação
                          </div>
                        </SelectItem>
                        <SelectItem value="SUSPENDED">
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                            Suspenso
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Funções:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <strong>Usuário:</strong> Acesso ao dashboard
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      <strong>Administrador:</strong> Acesso completo
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Status:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <strong>Ativo:</strong> Acesso imediato
                    </li>
                    <li className="flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-amber-500" />
                      <strong>Aguardando:</strong> Precisa aprovar
                    </li>
                    <li className="flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-red-500" />
                      <strong>Suspenso:</strong> Sem acesso
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Dica:</strong> Usuários criados pelo admin não precisam fazer pagamento para ativar a conta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
