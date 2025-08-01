interface PeriodicityConfig {
  intervalType: string
  intervalValue: number
  allowedWeekdays?: number[] | null
  allowedMonthDays?: number[] | null
  allowedMonths?: number[] | null
}

export function calculateNextPaymentDate(
  startDate: Date,
  periodicity: PeriodicityConfig
): Date {
  const nextDate = new Date(startDate)
  
  switch (periodicity.intervalType) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + periodicity.intervalValue)
      
      // Se há restrição de dias da semana
      if (periodicity.allowedWeekdays && periodicity.allowedWeekdays.length > 0) {
        while (!periodicity.allowedWeekdays.includes(nextDate.getDay())) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
      }
      break
      
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (7 * periodicity.intervalValue))
      break
      
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + periodicity.intervalValue)
      
      // Se há restrição de dias do mês
      if (periodicity.allowedMonthDays && periodicity.allowedMonthDays.length > 0) {
        const closestDay = periodicity.allowedMonthDays
          .sort((a, b) => Math.abs(a - nextDate.getDate()) - Math.abs(b - nextDate.getDate()))[0]
        nextDate.setDate(closestDay)
      }
      break
      
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + periodicity.intervalValue)
      break
  }
  
  return nextDate
}

export function generatePaymentSchedule(
  startDate: Date,
  installments: number,
  periodicity: PeriodicityConfig
): Date[] {
  const schedule: Date[] = []
  let currentDate = new Date(startDate)
  
  for (let i = 0; i < installments; i++) {
    if (i === 0) {
      schedule.push(new Date(currentDate))
    } else {
      currentDate = calculateNextPaymentDate(currentDate, periodicity)
      schedule.push(new Date(currentDate))
    }
  }
  
  return schedule
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