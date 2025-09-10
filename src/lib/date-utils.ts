import { toBrazilTime, getBrazilStartOfDay } from './timezone-utils'

/**
 * Formata uma data para o formato brasileiro (dd/mm/aaaa)
 * Usa timezone UTC-3 (Brasil) para evitar problemas de fuso horário
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return ''
  
  let date: Date
  
  if (dateString instanceof Date) {
    date = dateString
  } else if (dateString.includes('T')) {
    // Se a string já tem horário (formato ISO), usar diretamente
    date = new Date(dateString)
  } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Se é apenas data (YYYY-MM-DD), criar data normal
    const [year, month, day] = dateString.split('-').map(Number)
    date = new Date(year, month - 1, day) // month é 0-indexed
  } else {
    // Fallback para outros formatos
    date = new Date(dateString)
  }
  
  // Se a data veio do banco (formato ISO com timezone), usar UTC para formatar
  if (typeof dateString === 'string' && dateString.includes('T') && dateString.endsWith('Z')) {
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }
  
  return date.toLocaleDateString('pt-BR')
}

/**
 * Formata uma data e hora para o formato brasileiro
 */
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return ''
  
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  return date.toLocaleString('pt-BR')
}

/**
 * Verifica se uma data está vencida (comparando apenas as datas, ignorando horário)
 * Usa timezone UTC-3 (Brasil) para evitar problemas de fuso horário
 */
export function isOverdue(dueDate: string | Date, status?: string): boolean {
  if (status === 'PAID') return false
  
  // Criar data de hoje sem horário (meia-noite)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let due: Date
  
  if (dueDate instanceof Date) {
    due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
  } else {
    due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
  }
  
  return due < today
}

/**
 * Formata um valor monetário para o formato brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}