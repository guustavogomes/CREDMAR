'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Route, Users, Plus, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface RouteData {
  id: string
  description: string
  _count: {
    customers: number
  }
}

export default function RotasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewRouteInput, setShowNewRouteInput] = useState(false)
  const [newRouteDescription, setNewRouteDescription] = useState('')
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    routeId: '',
    routeName: ''
  })

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/routes')
      if (response.ok) {
        const data = await response.json()
        setRoutes(data)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar rotas',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar rotas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
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
        toast({
          title: 'Sucesso',
          description: 'Rota criada com sucesso'
        })
        setShowNewRouteInput(false)
        setNewRouteDescription('')
        fetchRoutes()
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

  const handleDelete = (routeId: string, routeName: string) => {
    setConfirmModal({
      isOpen: true,
      routeId,
      routeName
    })
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/routes/${confirmModal.routeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRoutes(routes.filter(r => r.id !== confirmModal.routeId))
        toast({
          title: 'Sucesso',
          description: 'Rota excluída com sucesso'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao excluir rota',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir rota',
        variant: 'destructive'
      })
    } finally {
      setConfirmModal({ isOpen: false, routeId: '', routeName: '' })
    }
  }

  const filteredRoutes = routes.filter(route =>
    route.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gerenciar Rotas</h1>
        </div>
        <Button 
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          onClick={() => setShowNewRouteInput(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Rota
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6 border-border bg-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar rotas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nova Rota */}
      {showNewRouteInput && (
        <Card className="mb-6 border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium text-foreground">
                <Route className="w-5 h-5" />
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
                  onClick={handleCreateRoute}
                  disabled={!newRouteDescription.trim()}
                  className="flex-1"
                >
                  Criar Rota
                </Button>
                <Button 
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
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Rotas</p>
                <p className="text-2xl font-bold text-foreground">{filteredRoutes.length}</p>
              </div>
              <Route className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rotas com Clientes</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredRoutes.filter(r => r._count.customers > 0).length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rotas Vazias</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredRoutes.filter(r => r._count.customers === 0).length}
                </p>
              </div>
              <Route className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground">Lista de Rotas</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="text-center py-8">
              <Route className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma rota encontrada' : 'Nenhuma rota cadastrada'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Clientes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.map((route) => (
                      <TableRow key={route.id} className="hover:bg-muted/30 border-border">
                        <TableCell className="font-medium text-foreground">
                          {route.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {route._count.customers} cliente(s)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {route._count.customers === 0 ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                              Vazia
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              Em uso
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(route.id, route.description)}
                            disabled={route._count.customers > 0}
                            className={route._count.customers > 0 
                              ? "opacity-50 cursor-not-allowed" 
                              : "hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 pt-4">
                {filteredRoutes.map((route) => (
                  <Card key={route.id} className="border-l-4 border-l-blue-500 border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">
                            {route.description}
                          </h3>
                        </div>
                        {route._count.customers === 0 ? (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                            Vazia
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Em uso
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          <Users className="w-3 h-3 mr-1" />
                          {route._count.customers} cliente(s)
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(route.id, route.description)}
                          disabled={route._count.customers > 0}
                          className={route._count.customers > 0 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, routeId: '', routeName: '' })}
        onConfirm={confirmDelete}
        title="Excluir Rota"
        description={`Tem certeza que deseja excluir a rota "${confirmModal.routeName}"? Esta ação não poderá ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}