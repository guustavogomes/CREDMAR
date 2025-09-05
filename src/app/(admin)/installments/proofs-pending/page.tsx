"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Installment {
  id: string
  amount: number
  dueDate: string
  proofImage: string
  proofStatus: string
  loan: {
    customer: {
      nomeCompleto: string
      cpf: string
    }
  }
}

export default function ProofsPendingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchInstallments()
    }
  }, [status, session, router])

  const fetchInstallments = async () => {
    try {
      const response = await fetch('/api/admin/installments/proofs-pending')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Verificar se o retorno é um array
      if (Array.isArray(data)) {
        setInstallments(data)
      } else {
        console.error('API retornou dados inválidos:', data)
        setError('Erro ao carregar dados')
      }
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error)
      setError('Erro ao carregar comprovantes pendentes')
    } finally {
      setLoading(false)
    }
  }

  const handleStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/admin/installments/${id}/proof-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      setInstallments(prev => prev.filter(inst => inst.id !== id))
      
      alert(`Comprovante ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso`)
    } catch (error) {
      alert('Erro ao atualizar status do comprovante')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (installments.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Comprovantes Pendentes</h1>
        <div className="text-center text-gray-600">
          <p>Nenhum comprovante pendente para aprovação.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Comprovantes Pendentes</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {installments.map(inst => (
          <Card key={inst.id} className="border-border bg-card">
            <CardHeader>
              <CardTitle>
                {inst.loan.customer.nomeCompleto} ({inst.loan.customer.cpf})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">Valor: <b>R$ {inst.amount.toFixed(2)}</b></div>
              <div className="mb-2">Vencimento: <b>{new Date(inst.dueDate).toLocaleDateString()}</b></div>
              <div className="mb-4">
                {inst.proofImage ? (
                  <div className="relative">
                    <Image 
                      src={inst.proofImage} 
                      alt="Comprovante" 
                      width={300} 
                      height={200} 
                      className="rounded border"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem:', inst.proofImage);
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'block';
                        }
                      }}
                    />
                    <div 
                      className="w-full h-48 bg-gray-100 border rounded flex items-center justify-center text-gray-500"
                    >
                      <div className="text-center">
                        <p>Erro ao carregar imagem</p>
                        <p className="text-xs mt-1">URL: {inst.proofImage}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 border rounded flex items-center justify-center text-gray-500">
                    Nenhuma imagem disponível
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="default" onClick={() => handleStatus(inst.id, 'APPROVED')}>Aprovar</Button>
                <Button variant="destructive" onClick={() => handleStatus(inst.id, 'REJECTED')}>Rejeitar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
