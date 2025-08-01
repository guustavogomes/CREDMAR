"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  User, 
  Shield 
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type User = {
  id: string
  name: string
  email: string
  status: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get("filter") || "all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { toast } = useToast()

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    const pendingUsers = users.filter(user => user.status === "PENDING_APPROVAL")
    if (selectedUsers.length === pendingUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(pendingUsers.map(user => user.id))
    }
  }

  const handleBatchApproval = async () => {
    if (selectedUsers.length === 0) return

    try {
      const response = await fetch("/api/admin/users/approve-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      })

      if (response.ok) {
        const result = await response.json()
        // Atualizar a lista de usuários
        setUsers(users.map(user => 
          selectedUsers.includes(user.id) 
            ? { ...user, status: "ACTIVE" }
            : user
        ))
        setSelectedUsers([])
        toast({
          title: "Sucesso",
          description: `${result.count} usuários aprovados com sucesso!`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao aprovar usuários",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao aprovar usuários:", error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar usuários",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Verificar se o usuário é um administrador
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    // Carregar usuários
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/users?filter=${filter}`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [session, status, router, filter])

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/users/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, status: newStatus }),
      })

      if (response.ok) {
        // Atualizar a lista de usuários
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ))
        toast({
          title: "Sucesso",
          description: "Status do usuário atualizado com sucesso",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar status do usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "SUSPENDED":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "PENDING_APPROVAL":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "PENDING_PAYMENT":
        return <CreditCard className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-slate-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Ativo"
      case "SUSPENDED":
        return "Suspenso"
      case "PENDING_APPROVAL":
        return "Aguardando Aprovação"
      case "PENDING_PAYMENT":
        return "Aguardando Pagamento"
      default:
        return status
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-5 w-5 text-red-500" />
      case "USER":
        return <User className="h-5 w-5 text-blue-500" />
      default:
        return <User className="h-5 w-5 text-slate-500" />
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador"
      case "USER":
        return "Usuário"
      default:
        return role
    }
  }

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const pendingUsers = users.filter(user => user.status === "PENDING_APPROVAL")
  const hasSelectedUsers = selectedUsers.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter(value)
            router.push(`/admin/users?filter=${value}`, { scroll: false })
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários</SelectItem>
            <SelectItem value="pending">Aguardando Aprovação</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="suspended">Suspensos</SelectItem>
            <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pendingUsers.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedUsers.length === pendingUsers.length && pendingUsers.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-sm text-amber-800">
              {selectedUsers.length > 0 
                ? `${selectedUsers.length} usuário(s) selecionado(s)`
                : `${pendingUsers.length} usuário(s) aguardando aprovação`
              }
            </span>
          </div>
          {hasSelectedUsers && (
            <button
              onClick={handleBatchApproval}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-9 rounded-md px-3 bg-green-500 hover:bg-green-600"
            >
              Aprovar Selecionados
            </button>
          )}
        </div>
      )}

      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum usuário encontrado com os filtros selecionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span>{getRoleText(user.role)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.status)}
                        <span>{getStatusText(user.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {user.status === "PENDING_APPROVAL" && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2"
                            />
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleStatusChange(user.id, "ACTIVE")}
                            >
                              Aprovar
                            </Button>
                          </div>
                        )}
                        {user.status === "ACTIVE" && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleStatusChange(user.id, "SUSPENDED")}
                          >
                            Suspender
                          </Button>
                        )}
                        {user.status === "SUSPENDED" && (
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleStatusChange(user.id, "ACTIVE")}
                          >
                            Reativar
                          </Button>
                        )}
                        {user.role === "USER" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            Detalhes
                          </Button>
                        )}
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
