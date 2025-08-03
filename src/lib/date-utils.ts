/**
 * Formata uma data para o formato brasileiro (dd/mm/aaaa)
 * Lida corretamente com strings de data para evitar problemas de fuso horário
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return ''
  
  // Se já é um objeto Date, usar os componentes UTC para evitar fuso horário
  if (dateString instanceof Date) {
    const utcDate = dateString
    const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
    return localDate.toLocaleDateString('pt-BR')
  }
  
  // Se a string já tem horário (formato ISO), usar componentes UTC
  if (dateString.includes('T')) {
    const utcDate = new Date(dateString)
    const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
    return localDate.toLocaleDateString('pt-BR')
  }
  
  // Se é apenas data (YYYY-MM-DD), criar data local para evitar problemas de fuso horário
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    return date.toLocaleDateString('pt-BR')
  }
  
  // Fallback para outros formatos
  const utcDate = new Date(dateString)
  const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
  return localDate.toLocaleDateString('pt-BR')
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
 */
export function isOverdue(dueDate: string | Date, status?: string): boolean {
  if (status === 'PAID') return false
  
  const today = new Date()
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate)
  
  // Zerar horários para comparar apenas as datas
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  
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