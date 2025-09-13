import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { asaasAPI } from '@/lib/asaas-api'
import { z } from 'zod'

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '')
  
  if (numbers.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false
  
  // Verifica CPFs inválidos conhecidos
  const invalidCPFs = ['00000000000', '11111111111', '22222222222', '33333333333', 
                      '44444444444', '55555555555', '66666666666', '77777777777', 
                      '88888888888', '99999999999', '11144477735']
  if (invalidCPFs.includes(numbers)) return false
  
  // Algoritmo de validação do CPF
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.substring(10, 11))) return false
  
  return true
}

// Schema de validação
const createAsaasPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que R$ 0,01'),
  method: z.literal('PIX'),
  description: z.string().optional(),
  month: z.string().optional(), // YYYY-MM format
  cpf: z.string().min(1, 'CPF é obrigatório').refine(validateCPF, 'CPF inválido')
})

export async function POST(request: NextRequest) {
  
  try {
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const validatedData = createAsaasPaymentSchema.parse(body)

    // Buscar dados do usuário para criar cliente no Asaas
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criar/atualizar cliente no Asaas
    const asaasCustomer = await asaasAPI.createOrUpdateCustomer({
      name: user.name || 'Cliente TaPago',
      email: user.email || '',
      cpfCnpj: validatedData.cpf
    })


    // Calcular data de vencimento (próximo dia útil)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)

    // Criar pagamento no Asaas
    const asaasPayment = await asaasAPI.createPayment({
      customer: asaasCustomer.id!,
      billingType: 'PIX',
      value: validatedData.amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description: validatedData.description || 'TaPago - Acesso ao Sistema',
      externalReference: `tapago_${session.user.id}_${Date.now()}`
    })


    // Buscar dados PIX do pagamento
    let pixQrCode = null
    let pixPayload = null
    
    if (asaasPayment.id) {
      try {
        const pixData = await asaasAPI.getPixData(asaasPayment.id)
        pixPayload = pixData.payload
        
        if (pixData.encodedImage) {
          pixQrCode = `data:image/png;base64,${pixData.encodedImage}`
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados PIX:', error)
      }
    }

    // Criar pagamento no banco de dados local
    const newPayment = await db.payment.create({
      data: {
        userId: session.user.id,
        amount: validatedData.amount,
        method: 'PIX',
        status: 'PENDING',
        description: validatedData.description || 'TaPago - Acesso ao Sistema',
        month: validatedData.month || new Date().toISOString().slice(0, 7),
        asaasPaymentId: asaasPayment.id,
        asaasCustomerId: asaasCustomer.id,
        asaasDueDate: dueDate,
        pixCode: pixPayload
      }
    })


    return NextResponse.json({
      payment: {
        id: asaasPayment.id,
        amount: validatedData.amount,
        pixQrCode,
        pixPayload,
        dueDate: dueDate.toISOString(),
        status: 'PENDING',
        createdAt: newPayment.createdAt,
      }
    })

  } catch (error) {
    console.error('Erro ao criar pagamento no Asaas:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao processar pagamento. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
