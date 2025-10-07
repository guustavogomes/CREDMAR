'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Clock, User, CreditCard, Trash2 } from 'lucide-react'

interface PendingUser {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
  payments: {
    id: string
    amount: number
    status: string
    method: string
    createdAt: string
  }[]
}

export default function ApproveUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Verificar se é admin (você pode ajustar essa lógica)
    if (session.user.email !== 'admin@tapago.com' && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchPendingUsers()
  }, [session, status, router])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/pending-users')
      
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data.users || [])
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar usuários pendentes',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários pendentes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string, userEmail: string) => {
    try {
      setApproving(userId)
      
      const response = await fetch('/api/admin/approve-user-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: '✅ Usuário Aprovado!',
          description: `${userEmail} foi ativado com sucesso`
        })
        
        // Remover da lista
        setPendingUsers(prev => prev.filter(user => user.id !== userId))
      } else {
        const error = await response.json()
        toast({
          title: 'Erro na Aprovação',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar usuário',
        variant: 'destructive'
      })
    } finally {
      setApproving(null)
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    // Confirmar exclusão
    if (!confirm(`Tem certeza que deseja EXCLUIR o usuário ${userEmail}?\n\nEsta ação não pode ser desfeita e irá remover:\n• Todos os dados do usuário\n• Pagamentos relacionados\n• Clientes cadastrados\n• Empréstimos (se não ativos)\n\nDigite "EXCLUIR" para confirmar:`)) {
      return
    }

    const confirmation = prompt('Digite "EXCLUIR" para confirmar a exclusão:')
    if (confirmation !== 'EXCLUIR') {
      toast({
        title: 'Exclusão Cancelada',
        description: 'Confirmação incorreta. Usuário não foi excluído.'
      })
      return
    }

    try {
      setDeleting(userId)
      
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: '🗑️ Usuário Excluído!',
          description: `${userEmail} foi removido permanentemente`
        })
        
        // Remover da lista
        setPendingUsers(prev => prev.filter(user => user.id !== userId))
      } else {
        const error = await response.json()
        toast({
          title: 'Erro na Exclusão',
          description: error.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuário',
        variant: 'destructive'
      })
    } finally {
      setDeleting(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários pendentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Aprovação Manual de Usuários
          </h1>
          <p className="text-gray-600">
            Usuários aguardando aprovação manual para acesso ao sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{pendingUsers.length}</div>
              <div className="text-sm text-gray-600">Usuários Pendentes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {pendingUsers.filter(u => u.payments.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Com Pagamentos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                R$ {pendingUsers.reduce((sum, u) => sum + u.payments.reduce((pSum, p) => pSum + p.amount, 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Usuários */}
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum usuário pendente
                </h3>
                <p className="text-gray-600">
                  Todos os usuários foram aprovados ou não há novos cadastros
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.id} className="border-l-4 border-l-orange-400">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {user.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Pagamentos:</strong> {user.payments.length}
                      </div>
                      {user.payments.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <strong>Último:</strong> R$ {user.payments[0]?.amount.toFixed(2)} - {user.payments[0]?.status}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveUser(user.id, user.email)}
                        disabled={approving === user.id || deleting === user.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approving === user.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Aprovando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => deleteUser(user.id, user.email)}
                        disabled={deleting === user.id || approving === user.id}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting === user.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Excluindo...
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

        {/* Botão de Refresh */}
        <div className="text-center mt-8">
          <Button
            onClick={fetchPendingUsers}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Carregando...
              </>
            ) : (
              'Atualizar Lista'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}