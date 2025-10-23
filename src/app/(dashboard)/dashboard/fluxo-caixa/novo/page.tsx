'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, TrendingUp, DollarSign, Info } from 'lucide-react'
import Link from 'next/link'

interface Creditor {
  id: string
  nome: string
  cpf: string
}

export default function NovaMovimentacaoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [creditors, setCreditors] = useState<Creditor[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    creditorId: '',
    type: 'CREDIT' as 'CREDIT' | 'DEBIT',
    category: 'DEPOSIT' as 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'LOAN_DISBURSEMENT' | 'INTERMEDIATOR_COMMISSION' | 'MANAGER_COMMISSION' | 'LOAN_RETURN',
    amount: '',
    description: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    
    if (status === "authenticated") {
      fetchCreditors()
    }
  }, [status, router])

  const fetchCreditors = async () => {
    try {
      const response = await fetch('/api/creditors')
      if (response.ok) {
        const data = await response.json()
        setCreditors(Array.isArray(data.creditors) ? data.creditors : [])
      }
    } catch (error) {
      console.error('Erro ao buscar credores:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.creditorId || !formData.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    if (parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Erro',
        description: 'O valor deve ser maior que zero',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/cash-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Movimentação criada com sucesso'
        })
        router.push('/dashboard/fluxo-caixa')
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao criar movimentação',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar movimentação',
        variant: 'destructive'
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard/fluxo-caixa">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Nova Movimentação</h1>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-credmar-red" />
                <span>Dados da Movimentação</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Credor */}
                <div>
                  <Label htmlFor="creditor">Credor *</Label>
                  <Select 
                    value={formData.creditorId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, creditorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o credor" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditors.map((creditor) => (
                        <SelectItem key={creditor.id} value={creditor.id}>
                          {creditor.nome} - {creditor.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo e Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        type: value as 'CREDIT' | 'DEBIT',
                        category: value === 'CREDIT' ? 'DEPOSIT' : 'WITHDRAWAL'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREDIT">Crédito (Entrada)</SelectItem>
                        <SelectItem value="DEBIT">Débito (Saída)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        category: value as 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'LOAN_DISBURSEMENT' | 'INTERMEDIATOR_COMMISSION' | 'MANAGER_COMMISSION' | 'LOAN_RETURN'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.type === 'CREDIT' ? (
                          <>
                            <SelectItem value="DEPOSIT">Depósito</SelectItem>
                            <SelectItem value="COMMISSION">Comissão</SelectItem>
                            <SelectItem value="MANAGER_COMMISSION">Comissão Gestor</SelectItem>
                            <SelectItem value="LOAN_RETURN">Retorno Empréstimo</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="WITHDRAWAL">Saque</SelectItem>
                            <SelectItem value="LOAN_DISBURSEMENT">Desembolso Empréstimo</SelectItem>
                            <SelectItem value="INTERMEDIATOR_COMMISSION">Comissão Intermediador</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                {/* Descrição */}
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição da movimentação (opcional)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/dashboard/fluxo-caixa" className="flex-1">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit"
                    className="flex-1 credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Criar Movimentação'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Informações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <DollarSign className="h-5 w-5 text-credmar-red" />
                <span>Tipos de Movimentação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Crédito (Entrada)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Depósito:</strong> Aporte de dinheiro do credor</li>
                  <li>• <strong>Comissão:</strong> Comissão recebida automaticamente</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Débito (Saída)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Saque:</strong> Retirada de dinheiro pelo credor</li>
                  <li>• <strong>Desembolso:</strong> Valor usado em empréstimos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Info className="h-5 w-5 text-blue-600" />
                <span>Dicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Use descrições claras para facilitar o controle</li>
                <li>• Verifique o saldo antes de registrar saques</li>
                <li>• Comissões são geradas automaticamente</li>
                <li>• Desembolsos são criados automaticamente nos empréstimos</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}