import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/admin/installments/[id]/proof-status
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { status } = await request.json() // status: 'APPROVED' | 'REJECTED'
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const installment = await db.installment.findUnique({ where: { id: params.id } })
  if (!installment) {
    return NextResponse.json({ error: 'Parcela não encontrada' }, { status: 404 })
  }

  const updateData: any = { proofStatus: status }
  if (status === 'APPROVED') {
    updateData.status = 'PAID'
    updateData.paidAt = new Date()
    updateData.paidAmount = installment.amount // Definir o valor pago como o valor total da parcela
  }

  await db.installment.update({
    where: { id: params.id },
    data: updateData
  })

  return NextResponse.json({ success: true })
}
