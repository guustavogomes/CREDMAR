"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar } from "lucide-react"
import { getBrazilianNow, formatBrazilianDate, formatBrazilianDateTime } from "@/lib/timezone-config"

export function CurrentDateTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Definir o estado inicial
    setCurrentTime(getBrazilianNow())
    
    // Atualizar a cada minuto
    const interval = setInterval(() => {
      setCurrentTime(getBrazilianNow())
    }, 60000) // 60 segundos

    return () => clearInterval(interval)
  }, [])

  if (!currentTime) {
    return null // Evita hidration mismatch
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {formatDate(currentTime)}
        </span>
      </div>
      <div className="w-px h-4 bg-border"></div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground font-mono">
          {formatTime(currentTime)}
        </span>
      </div>
    </div>
  )
}

export function CurrentDateTimeCompact() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(getBrazilianNow())
    
    const interval = setInterval(() => {
      setCurrentTime(getBrazilianNow())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (!currentTime) {
    return null
  }

  const formatCompact = (date: Date) => {
    const dateStr = date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit'
    })
    const timeStr = date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    return `${dateStr} • ${timeStr}`
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
      <Clock className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium text-primary font-mono">
        {formatCompact(currentTime)}
      </span>
    </div>
  )
}