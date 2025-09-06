import { parseBrazilDateString } from './timezone-utils'

interface PeriodicityConfig {
  intervalType: string
  intervalValue: number
  allowedWeekdays?: number[] | null
  allowedMonthDays?: number[] | null
  allowedMonths?: number[] | null
}

/**
 * Cria uma data no timezone do Brasil a partir de uma string no formato YYYY-MM-DD
 * Evita problemas de fuso horário
 */
function createLocalDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString
  }
  
  // Se é uma string no formato YYYY-MM-DD, usar timezone do Brasil
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return parseBrazilDateString(dateString)
  }
  
  return new Date(dateString)
}

export function calculateNextPaymentDate(
  startDate: Date,
  periodicity: PeriodicityConfig
): Date {
  let nextDate = new Date(startDate)
  
  switch (periodicity.intervalType) {
    case 'DAILY':
      // Para periodicidade diária, avançamos o número de dias especificado
      nextDate.setDate(nextDate.getDate() + periodicity.intervalValue)
      
      // Se há restrição de dias da semana, ajustamos para o próximo dia permitido
      if (periodicity.allowedWeekdays && periodicity.allowedWeekdays.length > 0) {
        nextDate = adjustToAllowedWeekday(nextDate, periodicity.allowedWeekdays)
      }
      break
      
    case 'WEEKLY':
      // Para periodicidade semanal, avançamos o número de semanas especificado
      nextDate.setDate(nextDate.getDate() + (7 * periodicity.intervalValue))
      
      // Mesmo para semanal, verificamos se há restrição de dias da semana
      if (periodicity.allowedWeekdays && periodicity.allowedWeekdays.length > 0) {
        nextDate = adjustToAllowedWeekday(nextDate, periodicity.allowedWeekdays)
      }
      break
      
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + periodicity.intervalValue)
      
      // Se há restrição de dias do mês
      if (periodicity.allowedMonthDays && periodicity.allowedMonthDays.length > 0) {
        const closestDay = periodicity.allowedMonthDays
          .sort((a, b) => Math.abs(a - nextDate.getDate()) - Math.abs(b - nextDate.getDate()))[0]
        nextDate.setDate(closestDay)
      }
      
      // Mesmo para mensal, verificamos se há restrição de dias da semana
      if (periodicity.allowedWeekdays && periodicity.allowedWeekdays.length > 0) {
        nextDate = adjustToAllowedWeekday(nextDate, periodicity.allowedWeekdays)
      }
      break
      
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + periodicity.intervalValue)
      
      // Mesmo para anual, verificamos se há restrição de dias da semana
      if (periodicity.allowedWeekdays && periodicity.allowedWeekdays.length > 0) {
        nextDate = adjustToAllowedWeekday(nextDate, periodicity.allowedWeekdays)
      }
      break
  }
  
  return nextDate
}

/**
 * Ajusta uma data para o próximo dia da semana permitido
 * Se a data já está em um dia permitido, retorna a própria data
 * Caso contrário, avança para o próximo dia permitido
 */
function adjustToAllowedWeekday(date: Date, allowedWeekdays: number[]): Date {
  const adjustedDate = new Date(date)
  let attempts = 0
  const maxAttempts = 7 // Evita loop infinito
  
  while (!allowedWeekdays.includes(adjustedDate.getDay()) && attempts < maxAttempts) {
    adjustedDate.setDate(adjustedDate.getDate() + 1)
    attempts++
  }
  
  return adjustedDate
}

export function generatePaymentSchedule(
  startDate: Date | string,
  installments: number,
  periodicity: PeriodicityConfig
): Date[] {
  const schedule: Date[] = []
  
  // Garantir que estamos trabalhando com a data local correta
  let currentDate = createLocalDate(startDate)
  
  // Primeira parcela: sempre usar a data inicial escolhida pelo usuário
  // Mas verificar se está em um dia permitido pela periodicidade
  if (periodicity.allowedWeekdays && periodicity.allowedWeekdays.length > 0) {
    // Se a data inicial não está em um dia permitido, ajustar para o próximo dia permitido
    if (!periodicity.allowedWeekdays.includes(currentDate.getDay())) {
      currentDate = adjustToAllowedWeekday(currentDate, periodicity.allowedWeekdays)
    }
  }
  
  schedule.push(new Date(currentDate))
  
  // Demais parcelas: calcular baseado na periodicidade
  for (let i = 1; i < installments; i++) {
    currentDate = calculateNextPaymentDate(currentDate, periodicity)
    schedule.push(new Date(currentDate))
  }
  
  return schedule
}

/**
 * Valida se uma data inicial é compatível com a periodicidade
 * Retorna um objeto com informações sobre a validação
 */
export function validateStartDateWithPeriodicity(
  startDate: Date,
  periodicity: PeriodicityConfig
): { isValid: boolean; suggestedDate?: Date; message?: string } {
  // Se não há restrições de dias da semana, qualquer data é válida
  if (!periodicity.allowedWeekdays || periodicity.allowedWeekdays.length === 0) {
    return { isValid: true }
  }
  
  const weekday = startDate.getDay()
  
  // Se a data está em um dia permitido, é válida
  if (periodicity.allowedWeekdays.includes(weekday)) {
    return { isValid: true }
  }
  
  // Se não está em um dia permitido, sugerir o próximo dia permitido
  const suggestedDate = adjustToAllowedWeekday(startDate, periodicity.allowedWeekdays)
  const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const allowedDayNames = periodicity.allowedWeekdays.map(d => weekdayNames[d]).join(', ')
  
  return {
    isValid: false,
    suggestedDate,
    message: `A data escolhida cai em ${weekdayNames[weekday]}, mas esta periodicidade só permite: ${allowedDayNames}. Sugerimos: ${suggestedDate.toLocaleDateString('pt-BR')}`
  }
}

export function formatPeriodicityDescription(periodicity: PeriodicityConfig): string {
  const { intervalType, intervalValue, allowedWeekdays } = periodicity
  
  if (intervalType === 'DAILY') {
    if (allowedWeekdays && allowedWeekdays.length > 0) {
      const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const days = allowedWeekdays.map(d => weekdayNames[d]).join(', ')
      return `Diário (${days})`
    }
    return intervalValue === 1 ? 'Diário' : `A cada ${intervalValue} dias`
  }
  
  if (intervalType === 'WEEKLY') {
    return intervalValue === 1 ? 'Semanal' : `A cada ${intervalValue} semanas`
  }
  
  if (intervalType === 'MONTHLY') {
    return intervalValue === 1 ? 'Mensal' : `A cada ${intervalValue} meses`
  }
  
  if (intervalType === 'YEARLY') {
    return intervalValue === 1 ? 'Anual' : `A cada ${intervalValue} anos`
  }
  
  return 'Personalizado'
}