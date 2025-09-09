/**
 * Utilitários para timezone UTC-3 (Brasil)
 * Centraliza todas as operações de data para evitar problemas de timezone
 */

import { getBrazilDateString } from './brazil-date'

// Offset do Brasil (UTC-3) em minutos
const BRAZIL_OFFSET_MINUTES = -3 * 60 // -180 minutos

/**
 * Converte uma data para timezone do Brasil (UTC-3)
 */
export function toBrazilTime(date: Date): Date {
  return new Date(date.getTime() + (BRAZIL_OFFSET_MINUTES * 60 * 1000))
}

/**
 * Converte uma data do timezone do Brasil para UTC
 */
export function fromBrazilTime(date: Date): Date {
  return new Date(date.getTime() - (BRAZIL_OFFSET_MINUTES * 60 * 1000))
}

/**
 * Obtém a data atual no timezone do Brasil
 */
export function getBrazilNow(): Date {
  return toBrazilTime(new Date())
}

/**
 * Cria uma data no timezone do Brasil
 */
export function createBrazilDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): Date {
  const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second))
  return fromBrazilTime(utcDate)
}

/**
 * Obtém o início do dia atual no timezone do Brasil
 */
export function getBrazilStartOfDay(date?: Date): Date {
  const baseDate = date || new Date()
  
  // Usar o mesmo padrão do timezone-config.ts
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(baseDate)
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1')
  
  // Retornar data local (não UTC) seguindo o padrão do timezone-config.ts
  return new Date(year, month, day, 0, 0, 0, 0)
}

/**
 * Obtém o fim do dia atual no timezone do Brasil
 */
export function getBrazilEndOfDay(date?: Date): Date {
  const startOfDay = getBrazilStartOfDay(date)
  // Adicionar 24 horas para o fim do dia
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
}

/**
 * Obtém o início do mês no timezone do Brasil
 */
export function getBrazilStartOfMonth(date?: Date): Date {
  const brazilDate = date ? toBrazilTime(date) : getBrazilNow()
  return createBrazilDate(
    brazilDate.getFullYear(),
    brazilDate.getMonth(),
    1,
    0, 0, 0
  )
}

/**
 * Obtém o fim do mês no timezone do Brasil
 */
export function getBrazilEndOfMonth(date?: Date): Date {
  const brazilDate = date ? toBrazilTime(date) : getBrazilNow()
  return createBrazilDate(
    brazilDate.getFullYear(),
    brazilDate.getMonth() + 1,
    1,
    0, 0, 0
  )
}

/**
 * Obtém o início da semana no timezone do Brasil
 */
export function getBrazilStartOfWeek(date?: Date): Date {
  const brazilDate = date ? toBrazilTime(date) : getBrazilNow()
  const startOfWeek = new Date(brazilDate)
  startOfWeek.setDate(brazilDate.getDate() - brazilDate.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return fromBrazilTime(startOfWeek)
}

/**
 * Obtém o fim da semana no timezone do Brasil
 */
export function getBrazilEndOfWeek(date?: Date): Date {
  const startOfWeek = getBrazilStartOfWeek(date)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return endOfWeek
}

/**
 * Formata uma data para string YYYY-MM-DD no timezone do Brasil
 */
export function formatBrazilDateToString(date: Date): string {
  const brazilDate = toBrazilTime(date)
  return brazilDate.toISOString().split('T')[0]
}

/**
 * Obtém a data atual do Brasil no formato YYYY-MM-DD para inputs
 * Agora usa Luxon para maior confiabilidade
 */
export function getBrazilTodayString(): string {
  return getBrazilDateString()
}

/**
 * Converte uma string YYYY-MM-DD para Date no timezone do Brasil
 */
export function parseBrazilDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  // Criar data local para evitar conversão de timezone
  return new Date(year, month - 1, day, 0, 0, 0, 0) // month é 0-indexed
}

/**
 * Verifica se uma data é hoje no timezone do Brasil
 */
export function isBrazilToday(date: Date): boolean {
  const today = getBrazilStartOfDay()
  const targetDate = getBrazilStartOfDay(date)
  return today.getTime() === targetDate.getTime()
}

/**
 * Verifica se uma data é amanhã no timezone do Brasil
 */
export function isBrazilTomorrow(date: Date): boolean {
  const tomorrow = getBrazilStartOfDay()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const targetDate = getBrazilStartOfDay(date)
  return tomorrow.getTime() === targetDate.getTime()
}

/**
 * Adiciona dias a uma data no timezone do Brasil
 */
export function addBrazilDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Obtém a diferença em dias entre duas datas no timezone do Brasil
 */
export function getBrazilDaysDifference(date1: Date, date2: Date): number {
  const brazilDate1 = getBrazilStartOfDay(date1)
  const brazilDate2 = getBrazilStartOfDay(date2)
  const diffTime = brazilDate2.getTime() - brazilDate1.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
