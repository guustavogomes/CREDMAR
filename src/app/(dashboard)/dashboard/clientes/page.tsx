'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface Customer {
  id: string
  cpf: string
  nomeCompleto: string
  celular: string
  endereco: string
  cidade: string
  estado: string
  bairro: string
  referencia?: string
  route: {
    id: string
    description: string
  }
  createdAt: string
}

export default function ClientesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Adicionar estados para o modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    customerId: '',
    customerName: ''
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    
    if (status === "authenticated") {
      fetchCustomers()
    }
  }, [status, router])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar clientes',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar clientes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, nomeCliente: string) => {
    setConfirmModal({
      isOpen: true,
      customerId: id,
      customerName: nomeCliente
    })
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/customers/${confirmModal.customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== confirmModal.customerId))
        toast({
          title: 'Sucesso',
          description: 'Cliente excluído com sucesso'
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir cliente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cliente',
        variant: 'destructive'
      })
    }
  }

const filteredCustomers = customers.filter(customer =>
  (customer.nomeCompleto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
  (customer.cpf || '').includes(searchTerm) ||
  (customer.route?.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
)

  const formatCPF = (cpf: string) => {
    if (!cpf) return ''
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Meus Clientes</h1>
        <Link href="/dashboard/clientes/novo">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="text-lg lg:text-xl font-bold text-slate-800">Lista de Clientes</CardTitle>
          <div className="flex items-center space-x-2 mt-4">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, CPF ou rota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-slate-500 max-w-md px-4">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece adicionando seu primeiro cliente.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">
                          {customer.nomeCompleto}
                        </TableCell>
                        <TableCell>{formatCPF(customer.cpf || '')}</TableCell>
                        <TableCell>{customer.celular}</TableCell>
                        <TableCell>{customer.cidade}/{customer.estado}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {customer.route?.description || 'Sem rota'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/dashboard/clientes/${customer.id}/editar`}>
                              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(customer.id, customer.nomeCompleto)}
                              className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {customer.nomeCompleto}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          CPF: {formatCPF(customer.cpf || '')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                        {customer.route?.description || 'Sem rota'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="font-medium mr-2">Celular:</span>
                        <a href={`tel:${customer.celular}`} className="text-blue-600 hover:underline">
                          {customer.celular}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <span className="font-medium mr-2">Cidade:</span>
                        {customer.cidade}/{customer.estado}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/dashboard/clientes/${customer.id}/editar`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 hover:border-blue-300">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer.id, customer.nomeCompleto)}
                        className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, customerId: '', customerName: '' })}
        onConfirm={confirmDelete}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir ${confirmModal.customerName}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
