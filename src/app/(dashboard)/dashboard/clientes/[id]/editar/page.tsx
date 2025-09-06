'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Camera, User, Upload } from 'lucide-react'
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

  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Converter para blob
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Fallback para arquivo original
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
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
      let fotoBase64 = formData.foto

      // Converter nova foto para base64 se houver
      if (fotoFile) {
        try {
          // Comprimir imagem antes de converter para base64
          const compressedFile = await compressImage(fotoFile)
          fotoBase64 = await convertFileToBase64(compressedFile)
          
          // Verificar se ainda está muito grande (limite de ~1MB em base64)
          if (fotoBase64.length > 1000000) {
            // Tentar compressão mais agressiva
            const moreCompressed = await compressImage(fotoFile, 300, 0.5)
            fotoBase64 = await convertFileToBase64(moreCompressed)
          }
        } catch (error) {
          console.error('Erro ao processar foto:', error)
          toast({
            title: 'Aviso',
            description: 'Erro ao processar a foto, dados serão salvos sem alterar a foto',
            variant: 'destructive'
          })
        }
      }

      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação do CPF
          foto: fotoBase64,
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
            {/* Seção da Foto do Cliente */}
            <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-lg">
              <div className="relative">
                {formData.foto || fotoFile ? (
                  <div className="relative">
                    <img 
                      src={fotoFile ? URL.createObjectURL(fotoFile) : formData.foto} 
                      alt={formData.nomeCompleto}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFotoFile(null)
                        setFormData(prev => ({ ...prev, foto: '' }))
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <label 
                  htmlFor="foto-upload"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                </label>
                
                <input
                  id="foto-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        toast({
                          title: 'Erro',
                          description: 'A imagem deve ter no máximo 5MB',
                          variant: 'destructive'
                        })
                        return
                      }
                      setFotoFile(file)
                    }
                  }}
                  className="hidden"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Foto do Cliente</p>
                <p className="text-xs text-gray-500 mt-1">
                  Clique no ícone da câmera para alterar a foto
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Formatos aceitos: JPG, PNG (máx. 5MB)
                </p>
              </div>
            </div>

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
                <SelectTrigger className="bg-white dark:bg-[hsl(222.2_84%_4.9%)]">
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
                <div className="mt-3 space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Rota
                  </div>
                  <Input
                    type="text"
                    value={newRouteDescription}
                    onChange={(e) => setNewRouteDescription(e.target.value)}
                    placeholder="Digite a descrição da nova rota (ex: Centro, Bairro Sul, etc.)"
                    className="w-full"
                    autoFocus
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      type="button" 
                      onClick={handleCreateRoute}
                      disabled={!newRouteDescription.trim()}
                      className="flex-1"
                    >
                      Criar Rota
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowNewRouteInput(false)
                        setNewRouteDescription('')
                      }}
                      className="flex-1"
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
