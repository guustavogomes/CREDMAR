"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, User } from "lucide-react"
import Link from "next/link"

interface CreditorForm {
  cpf: string
  nome: string
  telefone: string
  email: string
  endereco: string
  cidade: string
  estado: string
  observacoes: string
}

export default function NovoCredorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreditorForm>({
    cpf: "",
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    observacoes: ""
  })

  const handleInputChange = (field: keyof CreditorForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    if (formatted.replace(/\D/g, '').length <= 11) {
      handleInputChange('cpf', formatted)
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    if (formatted.replace(/\D/g, '').length <= 11) {
      handleInputChange('telefone', formatted)
    }
  }

  const validateForm = () => {
    if (!formData.cpf || !formData.nome) {
      toast({
        title: "Campos obrigatórios",
        description: "CPF e Nome são obrigatórios",
        variant: "destructive"
      })
      return false
    }

    const cpfNumbers = formData.cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "CPF deve ter 11 dígitos",
        variant: "destructive"
      })
      return false
    }

    if (formData.email && !formData.email.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/creditors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ''),
          telefone: formData.telefone.replace(/\D/g, '') || null,
          email: formData.email || null,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          observacoes: formData.observacoes || null
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Credor cadastrado com sucesso"
        })
        router.push('/dashboard/credores')
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao cadastrar credor",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar credor",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-credmar-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/credores">
          <Button variant="outline" size="sm" className="border-credmar-blue/20 text-credmar-blue hover:bg-credmar-blue/5">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-credmar-blue">Novo Credor</h1>
          <p className="text-credmar-blue-light mt-1">
            Cadastre um novo credor no sistema
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-credmar-red/5 to-credmar-blue/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-credmar-red/10 rounded-lg">
              <User className="h-5 w-5 text-credmar-red" />
            </div>
            <div>
              <CardTitle className="text-credmar-blue">Dados do Credor</CardTitle>
              <CardDescription className="text-credmar-blue-light">
                Preencha as informações do credor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Obrigatórios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-credmar-blue font-semibold">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  required
                  className="border-credmar-blue/20 focus:border-credmar-red"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-credmar-blue font-semibold">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome completo do credor"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                  className="border-credmar-blue/20 focus:border-credmar-red"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-credmar-blue font-semibold">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="border-credmar-blue/20 focus:border-credmar-red"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-credmar-blue font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="border-credmar-blue/20 focus:border-credmar-red"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-credmar-blue font-semibold">
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, complemento"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="border-credmar-blue/20 focus:border-credmar-red"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-credmar-blue font-semibold">
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    placeholder="Nome da cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="border-credmar-blue/20 focus:border-credmar-red"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-credmar-blue font-semibold">
                    Estado
                  </Label>
                  <Input
                    id="estado"
                    placeholder="UF"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                    maxLength={2}
                    className="border-credmar-blue/20 focus:border-credmar-red"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-credmar-blue font-semibold">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o credor..."
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                className="border-credmar-blue/20 focus:border-credmar-red"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Credor
                  </>
                )}
              </Button>
              <Link href="/dashboard/credores" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-credmar-blue/20 text-credmar-blue hover:bg-credmar-blue/5"
                >
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