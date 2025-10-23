'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  User,
  Eye,
  Filter
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/date-utils'
import Link from 'next/link'

interface CashFlow {
  id: string
  type: 'CREDIT' | 'DEBIT'
  category: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'LOAN_DISBURSEMENT' | 'INTERMEDIATOR_COMMISSION' | 'MANAGER_COMMISSION' | 'LOAN_RETURN'
  amount: number
  description?: string
  createdAt: string
  creditor: {
    id: string
    nome: string
    cpf: string
  }
  loan?: {
    id: string
    customer: {
      nomeCompleto: string
    }
  }
}

interface Creditor {
  id: string
  nome: string
  cpf: string
  balance?: number
}

export default function FluxoCaixaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [creditors, setCreditors] = useState<Creditor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCreditor, setSelectedCreditor] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    
    if (status === "authenticated") {
      fetchCashFlows()
      fetchCreditors()
    }
  }, [status, router])

  const fetchCashFlows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cash-flow')
      if (response.ok) {
        const data = await response.json()
        setCashFlows(data)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar movimentações',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar movimentações',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

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

  // Filtrar movimentações
  const filteredCashFlows = cashFlows.filter(flow => {
    const matchSearch = !searchTerm || 
      flow.creditor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.creditor.cpf.includes(searchTerm) ||
      flow.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchCreditor = selectedCreditor === 'all' || flow.creditor.id === selectedCreditor
    const matchType = selectedType === 'all' || flow.type === selectedType
    
    return matchSearch && matchCreditor && matchType
  })

  // Calcular saldos por credor
  const creditorBalances = creditors.map(creditor => {
    const creditorFlows = cashFlows.filter(flow => flow.creditor.id === creditor.id)
    const balance = creditorFlows.reduce((acc, flow) => {
      return flow.type === 'CREDIT' ? acc + flow.amount : acc - flow.amount
    }, 0)
    
    return {
      ...creditor,
      balance
    }
  })

  const getTypeIcon = (type: string) => {
    return type === 'CREDIT' ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownRight className="h-4 w-4 text-red-600" />
  }

  const getTypeBadge = (type: string) => {
    return type === 'CREDIT' ? 
      <Badge className="bg-green-100 text-green-700 border-green-200">Crédito</Badge> :
      <Badge className="bg-red-100 text-red-700 border-red-200">Débito</Badge>
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      'DEPOSIT': 'Depósito',
      'WITHDRAWAL': 'Saque',
      'COMMISSION': 'Comissão',
      'LOAN_DISBURSEMENT': 'Desembolso Empréstimo',
      'INTERMEDIATOR_COMMISSION': 'Comissão Intermediador',
      'MANAGER_COMMISSION': 'Comissão Gestor',
      'LOAN_RETURN': 'Retorno Empréstimo'
    }
    return labels[category as keyof typeof labels] || category
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-credmar-red"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
        <Link href="/dashboard/fluxo-caixa/novo">
          <Button className="w-full sm:w-auto credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Movimentação
          </Button>
        </Link>
      </div>

      {/* Saldos dos Credores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {creditorBalances.map((creditor) => (
          <Card key={creditor.id} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-credmar-red/10 rounded-lg">
                    <User className="h-5 w-5 text-credmar-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{creditor.nome}</p>
                    <p className="text-sm text-muted-foreground">{creditor.cpf}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-lg font-bold ${
                    creditor.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(creditor.balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-6 border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por credor ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCreditor} onValueChange={setSelectedCreditor}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por credor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os credores</SelectItem>
                {creditors.map((creditor) => (
                  <SelectItem key={creditor.id} value={creditor.id}>
                    {creditor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="CREDIT">Crédito</SelectItem>
                <SelectItem value="DEBIT">Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground">Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-credmar-red"></div>
            </div>
          ) : filteredCashFlows.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação cadastrada'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Credor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCashFlows.map((flow) => (
                    <TableRow key={flow.id} className="hover:bg-muted/30">
                      <TableCell className="text-muted-foreground">
                        {formatDate(flow.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{flow.creditor.nome}</div>
                          <div className="text-sm text-muted-foreground">{flow.creditor.cpf}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(flow.type)}
                          {getTypeBadge(flow.type)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getCategoryLabel(flow.category)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {flow.description || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        flow.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {flow.type === 'CREDIT' ? '+' : '-'}{formatCurrency(flow.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
}