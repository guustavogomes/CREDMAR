import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CreditorIntegrityCheck } from '@/lib/creditor-integrity-check'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'check'

    switch (action) {
      case 'check':
        // Verificação rápida para o usuário atual
        const isValid = await CreditorIntegrityCheck.quickIntegrityCheck(session.user.id)
        return NextResponse.json({ 
          isValid,
          message: isValid ? 'Dados íntegros' : 'Problemas detectados e corrigidos'
        })

      case 'report':
        // Relatório completo (apenas para admins)
        const report = await CreditorIntegrityCheck.generateIntegrityReport()
        return NextResponse.json(report)

      case 'full-check':
        // Verificação completa com correções
        const fullCheck = await CreditorIntegrityCheck.runFullIntegrityCheck()
        return NextResponse.json(fullCheck)

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na verificação de integridade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

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
    const { action, userId } = body

    switch (action) {
      case 'fix-user':
        // Corrigir problemas de um usuário específico
        const targetUserId = userId || session.user.id
        const fixed = await CreditorIntegrityCheck.fixManagerIntegrityIssues(targetUserId)
        
        return NextResponse.json({
          success: true,
          fixedIssues: fixed,
          message: fixed.length > 0 ? 'Problemas corrigidos' : 'Nenhum problema encontrado'
        })

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro na correção de integridade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}