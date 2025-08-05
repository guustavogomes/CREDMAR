import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { status } = await request.json() // status: 'APPROVED' | 'REJECTED'
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }
  const payment = await db.payment.findUnique({ where: { id: params.id } })
  if (!payment) {
    return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
  }
  await db.payment.update({
    where: { id: params.id },
    data: {
      status,
      approvedBy: status === 'APPROVED' ? session.user.id : null,
      approvedAt: status === 'APPROVED' ? new Date() : null,
      rejectedAt: status === 'REJECTED' ? new Date() : null,
    }
  })
  return NextResponse.json({ success: true })
}
