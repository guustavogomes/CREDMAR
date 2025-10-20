"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText } from "lucide-react"
import Link from "next/link"

interface Creditor {
  id: string
  cpf: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
}

export default function EditCreditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creditor, setCreditor] = useState<Creditor | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    observacoes: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && params.id) {
      fetchCreditor()
    }
  }, [session, params.id])

  const fetchCreditor = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/creditors/${params.id}`)
      
      if (response.ok) {
        const creditor = await response.json()
        setCreditor(creditor)
        setFormData({
          nome: creditor.nome || "",
          telefone: creditor.telefone || "",
          email: creditor.email || "",
          endereco: creditor.endereco || "",
          cidade: creditor.cidade || "",
          estado: creditor.estado || "",
          observacoes: creditor.observacoes || ""
        })
      } else if (response.status === 404) {
        toast({
          title: "Erro",
          description: "Credor não encontrado",
          variant: "destructive"
        })
        router.push("/dashboard/credores")
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar credor",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar credor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/creditors/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Credor atualizado com sucesso"
        })
        router.push("/dashboard/credores")
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar credor",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar credor",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-credmar-red"></div>
      </div>
    )
  }

  if (!creditor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Credor não encontrado</h2>
          <Link href="/dashboard/credores">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Credores
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/credores">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-credmar-blue">Editar Credor</h1>
          <p className="text-credmar-blue-light mt-1">
            Atualize as informações do credor
          </p>
        </div>
      </div>

      {/* Informações do Credor */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Atuais
          </CardTitle>
          <CardDescription>
            CPF: {formatCPF(creditor.cpf)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Formulário */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Dados do Credor</CardTitle>
          <CardDescription>
            Atualize as informações do credor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre o credor..."
                  className="pl-10 min-h-[100px]"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                disabled={saving}
                className="credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              
              <Link href="/dashboard/credores">
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}