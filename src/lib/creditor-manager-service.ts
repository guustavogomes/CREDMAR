import { db } from '@/lib/db'

export class CreditorManagerService {
  /**
   * Valida se apenas um credor gestor existe por usuário
   */
  static async validateManagerUniqueness(userId: string, excludeId?: string): Promise<boolean> {
    const existingManager = await db.creditor.findFirst({
      where: {
        userId,
        isManager: true,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } })
      }
    })

    return !existingManager
  }

  /**
   * Verifica se um credor pode ter sua flag de gestor alterada
   * (não pode alterar se há empréstimos ativos)
   */
  static async canChangeManagerFlag(creditorId: string): Promise<boolean> {
    const activeLoans = await db.loan.count({
      where: {
        creditorId,
        status: 'ACTIVE',
        deletedAt: null
      }
    })

    return activeLoans === 0
  }

  /**
   * Obtém o credor gestor de um usuário
   */
  static async getManagerCreditor(userId: string) {
    return await db.creditor.findFirst({
      where: {
        userId,
        isManager: true,
        deletedAt: null
      }
    })
  }

  /**
   * Define um credor como gestor (remove outros gestores do mesmo usuário)
   */
  static async setManager(creditorId: string, userId: string): Promise<void> {
    // Verificar se o credor existe e pertence ao usuário
    const creditor = await db.creditor.findFirst({
      where: {
        id: creditorId,
        userId,
        deletedAt: null
      }
    })

    if (!creditor) {
      throw new Error('Credor não encontrado')
    }

    // Verificar se pode alterar a flag (não há empréstimos ativos)
    const canChange = await this.canChangeManagerFlag(creditorId)
    if (!canChange) {
      throw new Error('Não é possível alterar o credor gestor pois há empréstimos ativos vinculados')
    }

    // Usar transação para garantir consistência
    await db.$transaction(async (tx) => {
      // Remover flag de gestor de outros credores do usuário
      await tx.creditor.updateMany({
        where: {
          userId,
          isManager: true,
          deletedAt: null,
          id: { not: creditorId }
        },
        data: {
          isManager: false
        }
      })

      // Definir o credor atual como gestor
      await tx.creditor.update({
        where: { id: creditorId },
        data: { isManager: true }
      })
    })
  }

  /**
   * Remove a flag de gestor de um credor
   */
  static async unsetManager(creditorId: string, userId: string): Promise<void> {
    // Verificar se o credor existe e pertence ao usuário
    const creditor = await db.creditor.findFirst({
      where: {
        id: creditorId,
        userId,
        isManager: true,
        deletedAt: null
      }
    })

    if (!creditor) {
      throw new Error('Credor gestor não encontrado')
    }

    // Verificar se pode alterar a flag (não há empréstimos ativos)
    const canChange = await this.canChangeManagerFlag(creditorId)
    if (!canChange) {
      throw new Error('Não é possível alterar o credor gestor pois há empréstimos ativos vinculados')
    }

    // Remover flag de gestor
    await db.creditor.update({
      where: { id: creditorId },
      data: { isManager: false }
    })
  }

  /**
   * Verifica a integridade dos dados de credor gestor
   * (usado para validação na inicialização)
   */
  static async validateDataIntegrity(userId: string): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = []

    // Verificar se há múltiplos gestores
    const managerCount = await db.creditor.count({
      where: {
        userId,
        isManager: true,
        deletedAt: null
      }
    })

    if (managerCount > 1) {
      issues.push(`Usuário ${userId} possui ${managerCount} credores gestores (deveria ter apenas 1)`)
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

// Tipos de erro específicos para operações de gestor
export enum CreditorManagerErrors {
  MANAGER_ALREADY_EXISTS = 'MANAGER_ALREADY_EXISTS',
  CANNOT_CHANGE_MANAGER_WITH_LOANS = 'CANNOT_CHANGE_MANAGER_WITH_LOANS',
  MANAGER_NOT_FOUND = 'MANAGER_NOT_FOUND',
  INVALID_MANAGER_OPERATION = 'INVALID_MANAGER_OPERATION'
}

export const creditorManagerErrorMessages = {
  [CreditorManagerErrors.MANAGER_ALREADY_EXISTS]: 'Já existe um credor gestor. Apenas um credor pode ser gestor por vez.',
  [CreditorManagerErrors.CANNOT_CHANGE_MANAGER_WITH_LOANS]: 'Não é possível alterar o credor gestor pois há empréstimos ativos vinculados.',
  [CreditorManagerErrors.MANAGER_NOT_FOUND]: 'Credor gestor não encontrado.',
  [CreditorManagerErrors.INVALID_MANAGER_OPERATION]: 'Operação inválida para credor gestor.'
}