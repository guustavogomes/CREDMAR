/**
 * Configuração global de timezone para o Brasil
 * Este arquivo deve ser importado no início da aplicação para configurar o timezone padrão
 */

// Define o timezone brasileiro globalmente para todas as operações de data
if (typeof process !== 'undefined' && process.env) {
  process.env.TZ = 'America/Sao_Paulo'
}

// Para navegadores, usa Intl para configurar o locale brasileiro
if (typeof window !== 'undefined') {
  // Configura o timezone padrão para formatação de datas
  const originalToLocaleString = Date.prototype.toLocaleString
  const originalToLocaleDateString = Date.prototype.toLocaleDateString
  const originalToLocaleTimeString = Date.prototype.toLocaleTimeString
  
  Date.prototype.toLocaleString = function(locales = 'pt-BR', options = {}) {
    return originalToLocaleString.call(this, locales, {
      timeZone: 'America/Sao_Paulo',
      ...options
    })
  }
  
  Date.prototype.toLocaleDateString = function(locales = 'pt-BR', options = {}) {
    return originalToLocaleDateString.call(this, locales, {
      timeZone: 'America/Sao_Paulo',
      ...options
    })
  }
  
  Date.prototype.toLocaleTimeString = function(locales = 'pt-BR', options = {}) {
    return originalToLocaleTimeString.call(this, locales, {
      timeZone: 'America/Sao_Paulo',
      ...options
    })
  }
}

/**
 * Função helper para criar uma data com timezone brasileiro
 */
export function createBrazilianDate(input?: string | number | Date): Date {
  const date = input ? new Date(input) : new Date()
  
  // Se estamos no servidor, usa o timezone configurado
  if (typeof process !== 'undefined' && process.env.TZ === 'America/Sao_Paulo') {
    return date
  }
  
  // Se estamos no cliente, converte para timezone brasileiro
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(date)
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1')
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0')
  
  return new Date(year, month, day, hour, minute, second)
}

/**
 * Obtém a data atual no timezone brasileiro
 */
export function getBrazilianNow(): Date {
  return createBrazilianDate()
}

/**
 * Obtém o início do dia atual no timezone brasileiro
 */
export function getBrazilianStartOfDay(date?: Date): Date {
  const brazilDate = date ? createBrazilianDate(date) : getBrazilianNow()
  return new Date(brazilDate.getFullYear(), brazilDate.getMonth(), brazilDate.getDate(), 0, 0, 0, 0)
}

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 */
export function formatBrazilianDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formata uma data e hora para o padrão brasileiro
 */
export function formatBrazilianDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}