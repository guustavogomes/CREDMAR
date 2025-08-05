import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const payments = await db.payment.findMany({
    where: {
      proofImage: { not: null },
      status: 'PENDING',
    },
    include: {
      user: true
    },
    orderBy: { createdAt: 'asc' }
  })
  return NextResponse.json(payments)
}
