'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, DollarSign, Search } from 'lucide-react'
import Link from 'next/link'
import { validateCPF, formatCPF } from '@/lib/cpf'
import { useCustomerScore } from '@/hooks/use-customer-score'
import { CustomerScore } from '@/components/ui/customer-score'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Route {
  id: string
  description: string
}

interface AddressData {
  cep: string
  endereco: string
  cidade: string
  estado: string
  bairro: string
  logradouro: string
}

export default function NovoClientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { loading: scoreLoading, scoreData, error: scoreError, fetchScore, clearScore } = useCustomerScore()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [showNewRouteInput, setShowNewRouteInput] = useState(false)
  const [newRouteDescription, setNewRouteDescription] = useState('')
  const [showLoanDialog, setShowLoanDialog] = useState(false)
  const [createdCustomerId, setCreatedCustomerId] = useState<string>('')
  const [createdCustomerName, setCreatedCustomerName] = useState<string>('')
  const [showScoreModal, setShowScoreModal] = useState(false)

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
    fetchRoutes()
  }, [])

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

  const handleCpfChange = (cpf: string) => {
    const formattedCpf = formatCPF(cpf)
    setFormData(prev => ({ ...prev, cpf: formattedCpf }))
  }

  const handleConsultarScore = async () => {
    const cleanCpf = formData.cpf.replace(/\D/g, '')
    
    if (cleanCpf.length !== 11) {
      toast({
        title: 'CPF Incompleto',
        description: 'Por favor, digite um CPF completo',
        variant: 'destructive'
      })
      return
    }
    
    if (!validateCPF(cleanCpf)) {
      toast({
        title: 'CPF Inválido',
        description: 'Por favor, digite um CPF válido',
        variant: 'destructive'
      })
      return
    }

    // Limpar dados anteriores
    clearScore()
    
    // Buscar score do cliente
    await fetchScore(cleanCpf)
  }

  const handleCreateRoute = async () => {
    if (!newRouteDescription.trim()) return

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: newRouteDescription })
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
          description: error.error || 'Erro ao criar rota',
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
    
    // Validações existentes...
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

    // Validar se a foto foi selecionada
    if (!fotoFile) {
      toast({
        title: 'Erro',
        description: 'A foto do cliente é obrigatória',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    try {
      // Converter foto para base64 (obrigatório)
      let fotoBase64 = ''
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
          title: 'Erro',
          description: 'Erro ao processar a foto. Por favor, tente novamente.',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }

      // Preparar dados para envio - remover formatação do CPF
      const dataToSend = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''), // Remove pontos, traços e espaços
        foto: fotoBase64 || null
      }
      
      console.log('Dados sendo enviados:', dataToSend)
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Cliente criado:', result)
        
        // Armazenar dados do cliente criado
        setCreatedCustomerId(result.id)
        setCreatedCustomerName(formData.nomeCompleto)
        
        toast({
          title: 'Sucesso',
          description: 'Cliente cadastrado com sucesso'
        })
        
        // Mostrar dialog perguntando sobre empréstimo
        setShowLoanDialog(true)
      } else {
        const error = await response.json()
        console.error('Erro na resposta:', error)
        
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao cadastrar cliente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro no catch:', error)
      
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar cliente',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLoan = () => {
    setShowLoanDialog(false)
    router.push(`/dashboard/emprestimos/novo?customerId=${createdCustomerId}`)
  }

  const handleGoToClients = () => {
    setShowLoanDialog(false)
    router.push('/dashboard/clientes')
  }



  const formatCepInput = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 8)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/clientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Novo Cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConsultarScore}
                    disabled={scoreLoading || !formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11}
                    className="px-4"
                  >
                    {scoreLoading ? (
                      <Search className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Score
                  </Button>
                </div>
                {scoreData && scoreData.found && (
                  <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-800">
                          Cliente encontrado na base!
                        </div>
                        <div className="text-xs text-blue-600">
                          Score: {scoreData.score?.value} ({scoreData.score?.class})
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowScoreModal(true)}
                        className="bg-white"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                )}
                {scoreData && !scoreData.found && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                    <span className="text-sm text-gray-600">
                      Cliente não encontrado na base de dados
                    </span>
                  </div>
                )}
                {scoreError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-sm text-red-600">
                      Erro ao consultar score: {scoreError}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    nomeCompleto: e.target.value 
                  }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="foto">Foto do Cliente *</Label>
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFotoFile(file)
                  }
                }}
                className="cursor-pointer"
                required
              />
              {fotoFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Arquivo selecionado: {fotoFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                A foto é obrigatória para identificação do cliente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    celular: e.target.value 
                  }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000000"
                  value={formData.cep}
                  onChange={(e) => handleCepChange(formatCepInput(e.target.value))}
                  required
                />
                {cepLoading && <p className="text-sm text-gray-500 mt-1">Buscando CEP...</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  endereco: e.target.value 
                }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    bairro: e.target.value 
                  }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cidade: e.target.value 
                  }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estado: e.target.value 
                  }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="referencia">Referência</Label>
              <Input
                id="referencia"
                placeholder="Nome e telefone de uma referência"
                value={formData.referencia}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  referencia: e.target.value 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="rota">Rota</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.routeId}
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
                  <SelectTrigger className="flex-1 bg-white dark:bg-[hsl(222.2_84%_4.9%)]">
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
              </div>
              
              {showNewRouteInput && (
                <div className="mt-3 space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Rota
                  </div>
                  <Input
                    placeholder="Digite a descrição da nova rota (ex: Centro, Bairro Sul, etc.)"
                    value={newRouteDescription}
                    onChange={(e) => setNewRouteDescription(e.target.value)}
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
                {loading ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog para perguntar sobre empréstimo */}
      <AlertDialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Cliente cadastrado com sucesso!
            </AlertDialogTitle>
            <AlertDialogDescription>
              O cliente <strong>{createdCustomerName}</strong> foi cadastrado com sucesso. 
              Deseja criar um empréstimo para este cliente agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleGoToClients}>
              Não, voltar para clientes
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateLoan} className="bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Sim, criar empréstimo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal do Score do Cliente */}
      {showScoreModal && (
        <CustomerScore 
          scoreData={scoreData} 
          onClose={() => setShowScoreModal(false)} 
        />
      )}
    </div>
  )
}
