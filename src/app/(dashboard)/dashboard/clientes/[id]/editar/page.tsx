'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { validateCPF, formatCPF } from '@/lib/cpf'

interface Route {
  id: string
  description: string
}

interface Customer {
  id: string
  cpf: string
  nomeCompleto: string
  celular: string
  cep: string
  endereco: string
  cidade: string
  estado: string
  bairro: string
  referencia?: string
  routeId: string
  foto?: string
  route: {
    id: string
    description: string
  }
}

interface AddressData {
  cep: string
  endereco: string
  cidade: string
  estado: string
  bairro: string
  logradouro: string
}

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [routes, setRoutes] = useState<Route[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [showNewRouteInput, setShowNewRouteInput] = useState(false)
  const [newRouteDescription, setNewRouteDescription] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)

  const [formData, setFormData] = useState({
    cpf: '',
    nomeCompleto: '',
    celular: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    bairro: '',
    referencia: '',
    routeId: '',
    foto: ''
  })

  const [fotoFile, setFotoFile] = useState<File | null>(null)

  useEffect(() => {
    fetchCustomer()
    fetchRoutes()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      if (response.ok) {
        const data: Customer = await response.json()
        setCustomer(data)
        setFormData({
          cpf: data.cpf,
          nomeCompleto: data.nomeCompleto,
          celular: data.celular,
          cep: data.cep,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          bairro: data.bairro,
          referencia: data.referencia || '',
          routeId: data.routeId,
          foto: data.foto || ''
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Cliente não encontrado',
          variant: 'destructive'
        })
        router.push('/dashboard/clientes')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cliente',
        variant: 'destructive'
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes')
      if (response.ok) {
        const data = await response.json()
        setRoutes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar rotas:', error)
    }
  }

  const handleCepChange = async (cep: string) => {
    setFormData(prev => ({ ...prev, cep }))
    
    if (cep.length === 8) {
      setCepLoading(true)
      try {
        const response = await fetch(`/api/cep/${cep}`)
        if (response.ok) {
          const addressData: AddressData = await response.json()
          setFormData(prev => ({
            ...prev,
            endereco: addressData.endereco,
            cidade: addressData.cidade,
            estado: addressData.estado,
            bairro: addressData.bairro
          }))
        } else {
          toast({
            title: 'Erro',
            description: 'CEP não encontrado',
            variant: 'destructive'
          })
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao buscar CEP',
          variant: 'destructive'
        })
      } finally {
        setCepLoading(false)
      }
    }
  }

  const handleCreateRoute = async () => {
    if (!newRouteDescription.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite a descrição da rota',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: newRouteDescription
        })
      })

      if (response.ok) {
        const newRoute = await response.json()
        setRoutes(prev => [...prev, newRoute])
        setFormData(prev => ({ ...prev, routeId: newRoute.id }))
        setShowNewRouteInput(false)
        setNewRouteDescription('')
        toast({
          title: 'Sucesso',
          description: 'Rota criada com sucesso'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar rota',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar rota',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!validateCPF(formData.cpf)) {
      toast({
        title: 'Erro',
        description: 'CPF inválido',
        variant: 'destructive'
      })
      return
    }

    if (!formData.nomeCompleto || !formData.celular || !formData.cep) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          routeId: formData.routeId || null // Garantir que seja null se vazio
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Cliente atualizado com sucesso'
        })
        router.push('/dashboard/clientes')
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao atualizar cliente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar cliente',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cliente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/clientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4">Editar Cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={formatCPF(formData.cpf)}
                  onChange={(e) => {
                    const cpf = e.target.value.replace(/\D/g, '')
                    setFormData(prev => ({ ...prev, cpf }))
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  type="text"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  type="text"
                  value={formData.cep}
                  onChange={(e) => {
                    const cep = e.target.value.replace(/\D/g, '')
                    handleCepChange(cep)
                  }}
                  placeholder="00000-000"
                  maxLength={8}
                  required
                  disabled={cepLoading}
                />
                {cepLoading && <p className="text-sm text-gray-500 mt-1">Buscando endereço...</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  type="text"
                  value={`${formData.cidade}/${formData.estado}`}
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="referencia">Referência</Label>
                <Input
                  id="referencia"
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Ex: Próximo ao mercado, casa azul..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="route">Rota (opcional)</Label>
              <Select
                value={formData.routeId || 'none'}
                onValueChange={(value) => {
                  if (value === 'new') {
                    setShowNewRouteInput(true)
                  } else if (value === 'none') {
                    setFormData(prev => ({ ...prev, routeId: '' }))
                  } else {
                    setFormData(prev => ({ ...prev, routeId: value }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma rota (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem rota</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.description}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Criar nova rota</SelectItem>
                </SelectContent>
              </Select>

              {showNewRouteInput && (
                <div className="mt-2 space-y-2">
                  <Input
                    type="text"
                    value={newRouteDescription}
                    onChange={(e) => setNewRouteDescription(e.target.value)}
                    placeholder="Digite a descrição da nova rota"
                  />
                  <div className="flex space-x-2">
                    <Button type="button" onClick={handleCreateRoute}>
                      Criar
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowNewRouteInput(false)
                        setNewRouteDescription('')
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Link href="/dashboard/clientes">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
