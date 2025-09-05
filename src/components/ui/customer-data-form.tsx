'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { User, MapPin, Phone, CreditCard } from 'lucide-react'

interface CustomerData {
  cpf: string
  phone: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
}

interface CustomerDataFormProps {
  onDataSubmit: (data: CustomerData) => void
  loading?: boolean
}

export function CustomerDataForm({ onDataSubmit, loading = false }: CustomerDataFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CustomerData>({
    cpf: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(10))) return false

    return true
  }

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const formatZipCode = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (field === 'phone') {
      formattedValue = formatPhone(value)
    } else if (field === 'address.zipCode') {
      formattedValue = formatZipCode(value)
    }

    setFormData(prev => {
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1]
        return {
          ...prev,
          address: {
            ...prev.address,
            [addressField]: formattedValue
          }
        }
      }
      return {
        ...prev,
        [field]: formattedValue
      }
    })

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar CPF
    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    // Validar telefone
    if (!formData.phone) {
      newErrors.phone = 'Telefone é obrigatório'
    } else if (formData.phone.replace(/[^\d]/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido'
    }

    // Validar endereço
    const requiredAddressFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
    requiredAddressFields.forEach(field => {
      if (!formData.address[field as keyof typeof formData.address]) {
        newErrors[`address.${field}`] = `${field === 'street' ? 'Rua' : 
          field === 'number' ? 'Número' :
          field === 'neighborhood' ? 'Bairro' :
          field === 'city' ? 'Cidade' :
          field === 'state' ? 'Estado' :
          field === 'zipCode' ? 'CEP' : field} é obrigatório`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onDataSubmit(formData)
    } else {
      toast({
        title: 'Dados inválidos',
        description: 'Por favor, corrija os erros no formulário',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Dados para Nota Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Dados Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className={errors.cpf ? 'border-red-500' : ''}
                  maxLength={14}
                />
                {errors.cpf && <p className="text-sm text-red-500">{errors.cpf}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                  maxLength={15}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  type="text"
                  placeholder="Nome da rua"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className={errors['address.street'] ? 'border-red-500' : ''}
                />
                {errors['address.street'] && <p className="text-sm text-red-500">{errors['address.street']}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  type="text"
                  placeholder="123"
                  value={formData.address.number}
                  onChange={(e) => handleInputChange('address.number', e.target.value)}
                  className={errors['address.number'] ? 'border-red-500' : ''}
                />
                {errors['address.number'] && <p className="text-sm text-red-500">{errors['address.number']}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                type="text"
                placeholder="Apartamento, casa, etc."
                value={formData.address.complement}
                onChange={(e) => handleInputChange('address.complement', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  type="text"
                  placeholder="Nome do bairro"
                  value={formData.address.neighborhood}
                  onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                  className={errors['address.neighborhood'] ? 'border-red-500' : ''}
                />
                {errors['address.neighborhood'] && <p className="text-sm text-red-500">{errors['address.neighborhood']}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Nome da cidade"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={errors['address.city'] ? 'border-red-500' : ''}
                />
                {errors['address.city'] && <p className="text-sm text-red-500">{errors['address.city']}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="SP"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className={errors['address.state'] ? 'border-red-500' : ''}
                  maxLength={2}
                />
                {errors['address.state'] && <p className="text-sm text-red-500">{errors['address.state']}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP *</Label>
              <Input
                id="zipCode"
                type="text"
                placeholder="00000-000"
                value={formData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                className={errors['address.zipCode'] ? 'border-red-500' : ''}
                maxLength={9}
              />
              {errors['address.zipCode'] && <p className="text-sm text-red-500">{errors['address.zipCode']}</p>}
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Continuar para Pagamento
                </>
              )}
            </Button>
          </div>

          {/* Informação sobre Nota Fiscal */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📄 Nota Fiscal:</strong> Estes dados serão utilizados para emissão da nota fiscal 
              do seu pagamento. Todos os campos marcados com * são obrigatórios.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
