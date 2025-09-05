/**
 * Formata uma data para o formato brasileiro (dd/mm/aaaa)
 * Lida corretamente com strings de data para evitar problemas de fuso horário
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return ''
  
  let date: Date
  
  if (dateString instanceof Date) {
    date = dateString
  } else if (dateString.includes('T')) {
    // Se a string já tem horário (formato ISO), usar componentes UTC
    const utcDate = new Date(dateString)
    date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
  } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Se é apenas data (YYYY-MM-DD), criar data local para evitar problemas de fuso horário
    const [year, month, day] = dateString.split('-').map(Number)
    date = new Date(year, month - 1, day) // month é 0-indexed
  } else {
    // Fallback para outros formatos - usar componentes UTC
    const utcDate = new Date(dateString)
    date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
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
 */
export function isOverdue(dueDate: string | Date, status?: string): boolean {
  if (status === 'PAID') return false
  
  const today = new Date()
  let due: Date
  
  if (dueDate instanceof Date) {
    due = dueDate
  } else if (dueDate.includes('T')) {
    // Se a string já tem horário (formato ISO), usar componentes UTC
    const utcDate = new Date(dueDate)
    due = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
  } else if (dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Se é apenas data (YYYY-MM-DD), criar data local
    const [year, month, day] = dueDate.split('-').map(Number)
    due = new Date(year, month - 1, day) // month é 0-indexed
  } else {
    // Fallback para outros formatos - usar componentes UTC
    const utcDate = new Date(dueDate)
    due = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
  }
  
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