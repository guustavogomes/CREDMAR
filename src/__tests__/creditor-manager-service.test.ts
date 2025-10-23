import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CreditorManagerService } from '@/lib/creditor-manager-service'

// Mock do Prisma
const mockPrisma = {
  creditor: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn()
  },
  loan: {
    count: vi.fn()
  },
  $transaction: vi.fn()
}

// Mock do módulo db
vi.mock('@/lib/db', () => ({
  db: mockPrisma
}))

describe('CreditorManagerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('validateManagerUniqueness', () => {
    it('should return true when no manager exists', async () => {
      mockPrisma.creditor.findFirst.mockResolvedValue(null)

      const result = await CreditorManagerService.validateManagerUniqueness('user1')

      expect(result).toBe(true)
      expect(mockPrisma.creditor.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isManager: true,
          deletedAt: null
        }
      })
    })

    it('should return false when manager already exists', async () => {
      mockPrisma.creditor.findFirst.mockResolvedValue({
        id: 'creditor1',
        isManager: true
      })

      const result = await CreditorManagerService.validateManagerUniqueness('user1')

      expect(result).toBe(false)
    })

    it('should exclude specific creditor when provided', async () => {
      mockPrisma.creditor.findFirst.mockResolvedValue(null)

      await CreditorManagerService.validateManagerUniqueness('user1', 'creditor1')

      expect(mockPrisma.creditor.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isManager: true,
          deletedAt: null,
          id: { not: 'creditor1' }
        }
      })
    })
  })

  describe('canChangeManagerFlag', () => {
    it('should return true when no active loans exist', async () => {
      mockPrisma.loan.count.mockResolvedValue(0)

      const result = await CreditorManagerService.canChangeManagerFlag('creditor1')

      expect(result).toBe(true)
      expect(mockPrisma.loan.count).toHaveBeenCalledWith({
        where: {
          creditorId: 'creditor1',
          status: 'ACTIVE',
          deletedAt: null
        }
      })
    })

    it('should return false when active loans exist', async () => {
      mockPrisma.loan.count.mockResolvedValue(2)

      const result = await CreditorManagerService.canChangeManagerFlag('creditor1')

      expect(result).toBe(false)
    })
  })

  describe('getManagerCreditor', () => {
    it('should return manager creditor when exists', async () => {
      const mockManager = {
        id: 'creditor1',
        nome: 'Gestor',
        isManager: true
      }
      mockPrisma.creditor.findFirst.mockResolvedValue(mockManager)

      const result = await CreditorManagerService.getManagerCreditor('user1')

      expect(result).toEqual(mockManager)
      expect(mockPrisma.creditor.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          isManager: true,
          deletedAt: null
        }
      })
    })

    it('should return null when no manager exists', async () => {
      mockPrisma.creditor.findFirst.mockResolvedValue(null)

      const result = await CreditorManagerService.getManagerCreditor('user1')

      expect(result).toBeNull()
    })
  })

  describe('setManager', () => {
    it('should set creditor as manager successfully', async () => {
      const mockCreditor = {
        id: 'creditor1',
        nome: 'Test Creditor',
        userId: 'user1'
      }

      mockPrisma.creditor.findFirst.mockResolvedValue(mockCreditor)
      mockPrisma.loan.count.mockResolvedValue(0) // No active loans
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })
      mockPrisma.creditor.updateMany.mockResolvedValue({ count: 0 })
      mockPrisma.creditor.update.mockResolvedValue(mockCreditor)

      await CreditorManagerService.setManager('creditor1', 'user1')

      expect(mockPrisma.creditor.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'creditor1',
          userId: 'user1',
          deletedAt: null
        }
      })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should throw error when creditor not found', async () => {
      mockPrisma.creditor.findFirst.mockResolvedValue(null)

      await expect(
        CreditorManagerService.setManager('creditor1', 'user1')
      ).rejects.toThrow('Credor não encontrado')
    })

    it('should throw error when creditor has active loans', async () => {
      const mockCreditor = {
        id: 'creditor1',
        nome: 'Test Creditor',
        userId: 'user1'
      }

      mockPrisma.creditor.findFirst.mockResolvedValue(mockCreditor)
      mockPrisma.loan.count.mockResolvedValue(2) // Has active loans

      await expect(
        CreditorManagerService.setManager('creditor1', 'user1')
      ).rejects.toThrow('Não é possível alterar o credor gestor pois há empréstimos ativos vinculados')
    })
  })

  describe('unsetManager', () => {
    it('should unset manager successfully', async () => {
      const mockCreditor = {
        id: 'creditor1',
        nome: 'Test Creditor',
        userId: 'user1',
        isManager: true
      }

      mockPrisma.creditor.findFirst.mockResolvedValue(mockCreditor)
      mockPrisma.loan.count.mockResolvedValue(0) // No active loans
      mockPrisma.creditor.update.mockResolvedValue({
        ...mockCreditor,
        isManager: false
      })

      await CreditorManagerService.unsetManager('creditor1', 'user1')

      expect(mockPrisma.creditor.update).toHaveBeenCalledWith({
        where: { id: 'creditor1' },
        data: { isManager: false }
      })
    })

    it('should throw error when manager not found', async () => {
      mockPrisma.creditor.findFirst.mockResolvedValue(null)

      await expect(
        CreditorManagerService.unsetManager('creditor1', 'user1')
      ).rejects.toThrow('Credor gestor não encontrado')
    })

    it('should throw error when manager has active loans', async () => {
      const mockCreditor = {
        id: 'creditor1',
        nome: 'Test Creditor',
        userId: 'user1',
        isManager: true
      }

      mockPrisma.creditor.findFirst.mockResolvedValue(mockCreditor)
      mockPrisma.loan.count.mockResolvedValue(1) // Has active loans

      await expect(
        CreditorManagerService.unsetManager('creditor1', 'user1')
      ).rejects.toThrow('Não é possível alterar o credor gestor pois há empréstimos ativos vinculados')
    })
  })

  describe('validateDataIntegrity', () => {
    it('should return valid when only one manager exists', async () => {
      mockPrisma.creditor.count.mockResolvedValue(1)

      const result = await CreditorManagerService.validateDataIntegrity('user1')

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should return invalid when multiple managers exist', async () => {
      mockPrisma.creditor.count.mockResolvedValue(3)

      const result = await CreditorManagerService.validateDataIntegrity('user1')

      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toContain('possui 3 credores gestores')
    })

    it('should return valid when no managers exist', async () => {
      mockPrisma.creditor.count.mockResolvedValue(0)

      const result = await CreditorManagerService.validateDataIntegrity('user1')

      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
  })
})