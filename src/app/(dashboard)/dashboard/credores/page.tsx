"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  AlertTriangle,
  Crown,
  X
} from "lucide-react"
import Link from "next/link"
import { ManagerBadge } from "@/components/ui/manager-badge"

interface Creditor {
  id: string
  cpf: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  observacoes?: string
  isManager: boolean
  createdAt: string
  _count: {
    loans: number
  }
}

interface CreditorResponse {
  creditors: Creditor[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function CreditorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [creditors, setCreditors] = useState<Creditor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Estados para os dialogs de confirmação
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; creditor: Creditor | null }>({
    open: false,
    creditor: null
  })
  const [managerDialog, setManagerDialog] = useState<{ open: boolean; creditor: Creditor | null }>({
    open: false,
    creditor: null
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchCreditors()
    }
  }, [session, search, page])

  const fetchCreditors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/creditors?${params}`)
      if (response.ok) {
        const data: CreditorResponse = await response.json()
        setCreditors(data.creditors)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar credores",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar credores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (creditor: Creditor) => {
    if (creditor._count.loans > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Este credor possui empréstimos ativos",
        variant: "destructive"
      })
      return
    }
    
    setDeleteDialog({ open: true, creditor })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.creditor) return

    try {
      const response = await fetch(`/api/creditors/${deleteDialog.creditor.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Credor excluído com sucesso"
        })
        fetchCreditors()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir credor",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir credor",
        variant: "destructive"
      })
    } finally {
      setDeleteDialog({ open: false, creditor: null })
    }
  }

  const handleToggleManagerClick = (creditor: Creditor) => {
    if (creditor._count.loans > 0) {
      toast({
        title: "Não é possível alterar",
        description: "Este credor possui empréstimos ativos",
        variant: "destructive"
      })
      return
    }
    
    setManagerDialog({ open: true, creditor })
  }

  const handleToggleManagerConfirm = async () => {
    if (!managerDialog.creditor) return

    const creditor = managerDialog.creditor
    const action = creditor.isManager ? 'remover' : 'definir'

    try {
      setToggleLoading(creditor.id)
      
      const endpoint = creditor.isManager ? 'unset-manager' : 'set-manager'
      const response = await fetch(`/api/creditors/${creditor.id}/${endpoint}`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sucesso",
          description: data.message
        })
        fetchCreditors()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || `Erro ao ${action} credor gestor`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao ${action} credor gestor`,
        variant: "destructive"
      })
    } finally {
      setToggleLoading(null)
      setManagerDialog({ open: false, creditor: null })
    }
  }

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-credmar-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-credmar-blue">Credores</h1>
          <p className="text-credmar-blue-light mt-1">
            Gerencie os credores do sistema
          </p>
        </div>
        <Link href="/dashboard/credores/novo">
          <Button className="credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Novo Credor
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF, telefone ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Credores */}
      <div className="grid gap-6">
        {creditors.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum credor encontrado
              </h3>
              <p className="text-gray-500 text-center mb-6">
                {search ? "Tente ajustar os filtros de busca" : "Comece cadastrando seu primeiro credor"}
              </p>
              <Link href="/dashboard/credores/novo">
                <Button className="credmar-red-gradient hover:from-credmar-red-dark hover:to-credmar-red text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Credor
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          creditors.map((creditor) => (
            <Card key={creditor.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-credmar-blue mb-1">
                          {creditor.nome}
                        </h3>
                        <p className="text-credmar-blue-light">
                          CPF: {formatCPF(creditor.cpf)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ManagerBadge isManager={creditor.isManager} size="sm" />
                        <Badge variant="outline" className="border-credmar-red/20 text-credmar-red">
                          {creditor._count.loans} empréstimo(s)
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {creditor.telefone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{formatPhone(creditor.telefone)}</span>
                        </div>
                      )}
                      {creditor.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{creditor.email}</span>
                        </div>
                      )}
                      {(creditor.cidade || creditor.estado) && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {creditor.cidade}
                            {creditor.cidade && creditor.estado && " - "}
                            {creditor.estado}
                          </span>
                        </div>
                      )}
                      {creditor.observacoes && (
                        <div className="flex items-start gap-2 text-gray-600 md:col-span-2">
                          <FileText className="h-4 w-4 mt-0.5" />
                          <span className="text-sm">{creditor.observacoes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <Link href={`/dashboard/credores/${creditor.id}/editar`} className="flex-1 lg:flex-none">
                      <Button variant="outline" size="sm" className="w-full border-credmar-blue/20 text-credmar-blue hover:bg-credmar-blue/5">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleManagerClick(creditor)}
                      className={`flex-1 lg:flex-none ${
                        creditor.isManager 
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50' 
                          : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                      }`}
                      disabled={creditor._count.loans > 0 || toggleLoading === creditor.id}
                      title={creditor._count.loans > 0 ? 'Não é possível alterar gestor com empréstimos ativos' : ''}
                    >
                      {toggleLoading === creditor.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2" />
                          Alterando...
                        </>
                      ) : creditor._count.loans > 0 ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Bloqueado
                        </>
                      ) : creditor.isManager ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Remover Gestor
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Definir Gestor
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(creditor)}
                      className="flex-1 lg:flex-none border-red-200 text-red-600 hover:bg-red-50"
                      disabled={creditor._count.loans > 0}
                    >
                      {creditor._count.loans > 0 ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Bloqueado
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {pagination.pages > 1 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {creditors.length} de {pagination.total} credores
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Página {page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação para excluir credor */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, creditor: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Excluir Credor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o credor <strong>{deleteDialog.creditor?.nome}</strong>?
              <br />
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Credor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para alterar gestor */}
      <AlertDialog open={managerDialog.open} onOpenChange={(open) => setManagerDialog({ open, creditor: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <Crown className="h-5 w-5" />
              {managerDialog.creditor?.isManager ? 'Remover Credor Gestor' : 'Definir Credor Gestor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {managerDialog.creditor?.isManager ? (
                <>
                  Tem certeza que deseja <strong>remover como gestor</strong> o credor <strong>{managerDialog.creditor?.nome}</strong>?
                  <br />
                  <span className="text-amber-700 font-medium">Este credor não será mais usado como padrão em novos empréstimos.</span>
                </>
              ) : (
                <>
                  Tem certeza que deseja <strong>definir como gestor</strong> o credor <strong>{managerDialog.creditor?.nome}</strong>?
                  <br />
                  <span className="text-amber-700 font-medium">Este credor representará seu capital próprio e será usado como padrão em novos empréstimos.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleManagerConfirm}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {managerDialog.creditor?.isManager ? 'Remover Gestor' : 'Definir Gestor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}