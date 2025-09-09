/**
 * Helper para datas brasileiras usando Luxon
 * Mais confiável para SSR e API routes
 */

import { DateTime } from 'luxon'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Obtém a data/hora atual do Brasil usando Luxon
 */
export function getBrazilDateTime(): DateTime {
  return DateTime.now().setZone(BRAZIL_TIMEZONE)
}

/**
 * Obtém a data atual do Brasil no formato YYYY-MM-DD
 */
export function getBrazilDateString(): string {
  return getBrazilDateTime().toFormat('yyyy-MM-dd')
}

/**
 * Obtém a data/hora atual do Brasil no formato ISO para o banco
 */
export function getBrazilDateTimeISO(): string {
  return getBrazilDateTime().toISO() || new Date().toISOString()
}

/**
 * Converte uma string YYYY-MM-DD para DateTime do Brasil
 */
export function parseBrazilDateString(dateString: string): DateTime {
  return DateTime.fromISO(dateString, { zone: BRAZIL_TIMEZONE })
}

/**
 * Converte DateTime do Brasil para Date nativo (para Prisma)
 */
export function brazilDateTimeToDate(luxonDate: DateTime): Date {
  return luxonDate.toJSDate()
}

/**
 * Converte Date nativo para DateTime do Brasil
 */
export function dateToBrazilDateTime(date: Date): DateTime {
  return DateTime.fromJSDate(date).setZone(BRAZIL_TIMEZONE)
}

/**
 * Formata DateTime do Brasil para exibição (DD/MM/YYYY)
 */
export function formatBrazilDate(date: DateTime | Date): string {
  const luxonDate = date instanceof Date ? dateToBrazilDateTime(date) : date
  return luxonDate.toFormat('dd/MM/yyyy')
}

/**
 * Formata DateTime do Brasil para exibição com hora (DD/MM/YYYY HH:mm)
 */
export function formatBrazilDateTime(date: DateTime | Date): string {
  const luxonDate = date instanceof Date ? dateToBrazilDateTime(date) : date
  return luxonDate.toFormat('dd/MM/yyyy HH:mm')
}

/**
 * Verifica se uma data é hoje no Brasil
 */
export function isBrazilToday(date: DateTime | Date): boolean {
  const luxonDate = date instanceof Date ? dateToBrazilDateTime(date) : date
  const today = getBrazilDateTime()
  return luxonDate.hasSame(today, 'day')
}

/**
 * Obtém o início do dia no Brasil
 */
export function getBrazilStartOfDay(date?: DateTime | Date): DateTime {
  if (date) {
    const luxonDate = date instanceof Date ? dateToBrazilDateTime(date) : date
    return luxonDate.startOf('day')
  }
  return getBrazilDateTime().startOf('day')
}

/**
 * Obtém o fim do dia no Brasil
 */
export function getBrazilEndOfDay(date?: DateTime | Date): DateTime {
  if (date) {
    const luxonDate = date instanceof Date ? dateToBrazilDateTime(date) : date
    return luxonDate.endOf('day')
  }
  return getBrazilDateTime().endOf('day')
}