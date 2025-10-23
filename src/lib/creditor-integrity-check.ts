import { db } from '@/lib/db'
import { CreditorManagerService } from '@/lib/creditor-manager-service'

export class CreditorIntegrityCheck {
  /**
   * Executa verificação completa de integridade dos dados de credores
   */
  static async runFullIntegrityCheck(): Promise<{
    isValid: boolean
    issues: string[]
    fixedIssues: string[]
  }> {
    const issues: string[] = []
    const fixedIssues: string[] = []

    try {
      // Buscar todos os usuários
      const users = await db.user.findMany({
        select: { id: true, email: true }
      })

      for (const user of users) {
        // Verificar integridade para cada usuário
        const userCheck = await CreditorManagerService.validateDataIntegrity(user.id)
        
        if (!userCheck.isValid) {
          issues.push(...userCheck.issues)
          
          // Tentar corrigir automaticamente
          const fixed = await this.fixManagerIntegrityIssues(user.id)
          if (fixed.length > 0) {
            fixedIssues.push(...fixed)
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        fixedIssues
      }
    } catch (error) {
      console.error('Erro na verificação de integridade:', error)
      return {
        isValid: false,
        issues: ['Erro interno na verificação de integridade'],
        fixedIssues: []
      }
    }
  }

  /**
   * Corrige problemas de integridade relacionados a múltiplos gestores
   */
  static async fixManagerIntegrityIssues(userId: string): Promise<string[]> {
    const fixedIssues: string[] = []

    try {
      // Buscar todos os credores gestores do usuário
      const managerCreditors = await db.creditor.findMany({
        where: {
          userId,
          isManager: true,
          deletedAt: null
        },
        orderBy: { createdAt: 'asc' } // Manter o mais antigo
      })

      if (managerCreditors.length > 1) {
        // Manter apenas o primeiro (mais antigo) como gestor
        const keepManager = managerCreditors[0]
        const removeManagers = managerCreditors.slice(1)

        // Remover flag de gestor dos outros
        for (const creditor of removeManagers) {
          await db.creditor.update({
            where: { id: creditor.id },
            data: { isManager: false }
          })
          
          fixedIssues.push(
            `Removida flag de gestor do credor ${creditor.nome} (${creditor.cpf}) - mantido apenas ${keepManager.nome}`
          )
        }
      }

      return fixedIssues
    } catch (error) {
      console.error('Erro ao corrigir problemas de integridade:', error)
      return []
    }
  }

  /**
   * Verifica se um usuário específico tem problemas de integridade
   */
  static async checkUserIntegrity(userId: string): Promise<{
    isValid: boolean
    issues: string[]
    managerCount: number
    managerCreditor?: any
  }> {
    try {
      const managerCreditors = await db.creditor.findMany({
        where: {
          userId,
          isManager: true,
          deletedAt: null
        }
      })

      const issues: string[] = []
      
      if (managerCreditors.length > 1) {
        issues.push(`Usuário possui ${managerCreditors.length} credores gestores (deveria ter no máximo 1)`)
      }

      return {
        isValid: issues.length === 0,
        issues,
        managerCount: managerCreditors.length,
        managerCreditor: managerCreditors[0] || null
      }
    } catch (error) {
      console.error('Erro na verificação de integridade do usuário:', error)
      return {
        isValid: false,
        issues: ['Erro interno na verificação'],
        managerCount: 0
      }
    }
  }

  /**
   * Executa verificação rápida durante login/inicialização
   */
  static async quickIntegrityCheck(userId: string): Promise<boolean> {
    try {
      const check = await this.checkUserIntegrity(userId)
      
      if (!check.isValid) {
        console.warn(`Problemas de integridade detectados para usuário ${userId}:`, check.issues)
        
        // Tentar correção automática
        const fixed = await this.fixManagerIntegrityIssues(userId)
        if (fixed.length > 0) {
          console.log(`Problemas corrigidos automaticamente:`, fixed)
        }
      }

      return check.isValid
    } catch (error) {
      console.error('Erro na verificação rápida de integridade:', error)
      return false
    }
  }

  /**
   * Gera relatório detalhado de integridade
   */
  static async generateIntegrityReport(): Promise<{
    totalUsers: number
    usersWithIssues: number
    totalIssues: number
    issuesByType: Record<string, number>
    details: Array<{
      userId: string
      userEmail?: string
      issues: string[]
      managerCount: number
    }>
  }> {
    try {
      const users = await db.user.findMany({
        select: { id: true, email: true }
      })

      const report = {
        totalUsers: users.length,
        usersWithIssues: 0,
        totalIssues: 0,
        issuesByType: {} as Record<string, number>,
        details: [] as Array<{
          userId: string
          userEmail?: string
          issues: string[]
          managerCount: number
        }>
      }

      for (const user of users) {
        const check = await this.checkUserIntegrity(user.id)
        
        if (!check.isValid) {
          report.usersWithIssues++
          report.totalIssues += check.issues.length
          
          // Contar tipos de problemas
          check.issues.forEach(issue => {
            const type = issue.includes('múltiplos') ? 'multiple_managers' : 'other'
            report.issuesByType[type] = (report.issuesByType[type] || 0) + 1
          })

          report.details.push({
            userId: user.id,
            userEmail: user.email,
            issues: check.issues,
            managerCount: check.managerCount
          })
        }
      }

      return report
    } catch (error) {
      console.error('Erro ao gerar relatório de integridade:', error)
      throw error
    }
  }
}