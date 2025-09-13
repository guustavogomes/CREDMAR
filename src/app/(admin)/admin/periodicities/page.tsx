"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Calendar, Clock, Edit } from "lucide-react"
import { formatPeriodicityDescription } from "@/lib/periodicity-utils"

type Periodicity = {
  id: string
  name: string
  description: string | null
  intervalType: string
  intervalValue: number
  allowedWeekdays: string | null
  allowedMonthDays: string | null
  allowedMonths: string | null
  createdAt: string
}

export default function PeriodicitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [periodicities, setPeriodicities] = useState<Periodicity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPeriodicity, setEditingPeriodicity] = useState<Periodicity | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    intervalType: 'MONTHLY',
    intervalValue: 1,
    allowedWeekdays: [] as number[],
    allowedMonthDays: [] as number[],
    allowedMonths: [] as number[]
  })

  const weekdays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' }
  ]

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
    } else {
      fetchPeriodicities()
    }
  }, [status, session, router])

  const fetchPeriodicities = async () => {
    try {
      const response = await fetch('/api/periodicities')
      
      if (response.ok) {
        const data = await response.json()
        setPeriodicities(data)
      } else {
        console.error('Erro na resposta:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Erro ao buscar periodicidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      })
      return
    }

    try {
      const submitData = {
        ...formData,
        allowedWeekdays: formData.allowedWeekdays.length > 0 ? JSON.stringify(formData.allowedWeekdays) : null,
        allowedMonthDays: formData.allowedMonthDays.length > 0 ? JSON.stringify(formData.allowedMonthDays) : null,
        allowedMonths: formData.allowedMonths.length > 0 ? JSON.stringify(formData.allowedMonths) : null
      }

      const response = await fetch("/api/periodicities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const newPeriodicity = await response.json()
        setPeriodicities([...periodicities, newPeriodicity])
        setFormData({
          name: '',
          description: '',
          intervalType: 'MONTHLY',
          intervalValue: 1,
          allowedWeekdays: [],
          allowedMonthDays: [],
          allowedMonths: []
        })
        setShowForm(false)
        toast({
          title: 'Sucesso',
          description: 'Periodicidade criada com sucesso'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar periodicidade',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta periodicidade?')) {
      return
    }

    try {
      const response = await fetch(`/api/periodicities/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPeriodicities(periodicities.filter(p => p.id !== id))
        toast({
          title: 'Sucesso',
          description: 'Periodicidade excluída com sucesso'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir periodicidade',
        variant: 'destructive'
      })
    }
  }

  const initializeDefaultPeriodicities = async () => {
    const defaultPeriodicities = [
      { 
        name: "Parcela Única", 
        description: "Pagamento único",
        intervalType: "MONTHLY",
        intervalValue: 1
      },
      { 
        name: "Diariamente", 
        description: "Todos os dias",
        intervalType: "DAILY",
        intervalValue: 1
      },
      { 
        name: "Diário Segunda a Sexta", 
        description: "Dias úteis",
        intervalType: "DAILY",
        intervalValue: 1,
        allowedWeekdays: JSON.stringify([1,2,3,4,5])
      },
      { 
        name: "Diário Segunda a Sábado", 
        description: "Segunda a sábado",
        intervalType: "DAILY",
        intervalValue: 1,
        allowedWeekdays: JSON.stringify([1,2,3,4,5,6])
      },
      { 
        name: "Semanal", 
        description: "A cada 7 dias",
        intervalType: "WEEKLY",
        intervalValue: 1
      },
      { 
        name: "Quinzenal", 
        description: "A cada 15 dias",
        intervalType: "DAILY",
        intervalValue: 15
      },
      { 
        name: "Mensal", 
        description: "A cada 30 dias",
        intervalType: "MONTHLY",
        intervalValue: 1
      },
      { 
        name: "Trimestral", 
        description: "A cada 3 meses",
        intervalType: "MONTHLY",
        intervalValue: 3
      }
    ]

    for (const periodicity of defaultPeriodicities) {
      try {
        await fetch("/api/periodicities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(periodicity),
        })
      } catch (error) {
        console.error("Erro ao criar periodicidade padrão:", error)
      }
    }
    
    fetchPeriodicities()
  }

  const parsePeriodicityConfig = (periodicity: Periodicity) => {
    return {
      intervalType: periodicity.intervalType,
      intervalValue: periodicity.intervalValue,
      allowedWeekdays: periodicity.allowedWeekdays ? JSON.parse(periodicity.allowedWeekdays) : null,
      allowedMonthDays: periodicity.allowedMonthDays ? JSON.parse(periodicity.allowedMonthDays) : null,
      allowedMonths: periodicity.allowedMonths ? JSON.parse(periodicity.allowedMonths) : null
    }
  }

  const handleEdit = (periodicity: Periodicity) => {
    const config = parsePeriodicityConfig(periodicity)
    setFormData({
      name: periodicity.name,
      description: periodicity.description || '',
      intervalType: periodicity.intervalType,
      intervalValue: periodicity.intervalValue,
      allowedWeekdays: config.allowedWeekdays || [],
      allowedMonthDays: config.allowedMonthDays || [],
      allowedMonths: config.allowedMonths || []
    })
    setEditingPeriodicity(periodicity)
    setShowForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      })
      return
    }

    try {
      const submitData = {
        ...formData,
        allowedWeekdays: formData.allowedWeekdays.length > 0 ? JSON.stringify(formData.allowedWeekdays) : null,
        allowedMonthDays: formData.allowedMonthDays.length > 0 ? JSON.stringify(formData.allowedMonthDays) : null,
        allowedMonths: formData.allowedMonths.length > 0 ? JSON.stringify(formData.allowedMonths) : null
      }

      const response = await fetch(`/api/periodicities/${editingPeriodicity!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const updatedPeriodicity = await response.json()
        setPeriodicities(periodicities.map(p => 
          p.id === editingPeriodicity!.id ? updatedPeriodicity : p
        ))
        setFormData({
          name: '',
          description: '',
          intervalType: 'MONTHLY',
          intervalValue: 1,
          allowedWeekdays: [],
          allowedMonthDays: [],
          allowedMonths: []
        })
        setEditingPeriodicity(null)
        setShowForm(false)
        toast({
          title: 'Sucesso',
          description: 'Periodicidade atualizada com sucesso'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar periodicidade',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Periodicidades</h1>
        <div className="flex gap-2">
          {periodicities.length === 0 && (
            <Button onClick={initializeDefaultPeriodicities} variant="outline">
              Criar Padrões
            </Button>
          )}
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Periodicidade
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {editingPeriodicity ? 'Editar Periodicidade' : 'Nova Periodicidade'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingPeriodicity ? handleUpdate : handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Semanal"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: A cada 7 dias"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="intervalType">Tipo de Intervalo *</Label>
                  <Select value={formData.intervalType} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, intervalType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="intervalValue">A cada quantos {formData.intervalType === 'DAILY' ? 'dias' : formData.intervalType === 'WEEKLY' ? 'semanas' : formData.intervalType === 'MONTHLY' ? 'meses' : 'anos'}</Label>
                  <Input
                    id="intervalValue"
                    type="number"
                    min="1"
                    value={formData.intervalValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, intervalValue: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {(formData.intervalType === 'DAILY' || formData.intervalType === 'WEEKLY') && (
                <div>
                  <Label>Dias da Semana Permitidos</Label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                    {weekdays.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`weekday-${day.value}`}
                          checked={formData.allowedWeekdays.includes(day.value)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                allowedWeekdays: [...prev.allowedWeekdays, day.value]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                allowedWeekdays: prev.allowedWeekdays.filter(d => d !== day.value)
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`weekday-${day.value}`} className="text-sm">
                          {day.label.slice(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPeriodicity ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false)
                    setEditingPeriodicity(null)
                    setFormData({
                      name: '',
                      description: '',
                      intervalType: 'MONTHLY',
                      intervalValue: 1,
                      allowedWeekdays: [],
                      allowedMonthDays: [],
                      allowedMonths: []
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Periodicidades Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodicities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma periodicidade</h3>
              <p className="mt-1 text-sm text-gray-500">Comece criando uma nova periodicidade.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Configuração</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodicities.map((periodicity) => (
                  <TableRow key={periodicity.id}>
                    <TableCell className="font-medium">{periodicity.name}</TableCell>
                    <TableCell>{periodicity.description || '-'}</TableCell>
                    <TableCell>
                      {formatPeriodicityDescription(parsePeriodicityConfig(periodicity))}
                    </TableCell>
                    <TableCell>
                      {new Date(periodicity.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(periodicity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(periodicity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}









