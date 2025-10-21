"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Calendar,
  DollarSign
} from "lucide-react"

interface NotificationWidgetProps {
  stats: {
    duesToday: { count: number }
    overdue: { count: number }
    duesThisWeek: { count: number }
  }
}

interface Notification {
  id: string
  type: 'warning' | 'success' | 'info' | 'error'
  title: string
  message: string
  timestamp: Date
  action?: {
    label: string
    href: string
  }
}

export function NotificationWidget({ stats }: NotificationWidgetProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Gerar notificações baseadas nas estatísticas
    const newNotifications: Notification[] = []

    if (stats.overdue.count > 0) {
      newNotifications.push({
        id: 'overdue',
        type: 'error',
        title: 'Parcelas em Atraso',
        message: `${stats.overdue.count} parcelas precisam de atenção urgente`,
        timestamp: new Date(),
        action: {
          label: 'Ver Detalhes',
          href: '/dashboard/vencimentos/atraso'
        }
      })
    }

    if (stats.duesToday.count > 0) {
      newNotifications.push({
        id: 'today',
        type: 'warning',
        title: 'Vencimentos Hoje',
        message: `${stats.duesToday.count} parcelas vencem hoje`,
        timestamp: new Date(),
        action: {
          label: 'Verificar',
          href: '/dashboard/vencimentos/hoje'
        }
      })
    }

    if (stats.duesThisWeek.count > 0) {
      newNotifications.push({
        id: 'week',
        type: 'info',
        title: 'Vencimentos da Semana',
        message: `${stats.duesThisWeek.count} parcelas vencem nos próximos 7 dias`,
        timestamp: new Date(),
        action: {
          label: 'Planejar',
          href: '/dashboard/vencimentos/semana'
        }
      })
    }

    if (newNotifications.length === 0) {
      newNotifications.push({
        id: 'all-good',
        type: 'success',
        title: 'Tudo em Ordem!',
        message: 'Não há vencimentos urgentes no momento',
        timestamp: new Date()
      })
    }

    setNotifications(newNotifications)
    setIsVisible(true)
  }, [stats])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Clock className="h-4 w-4 text-amber-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'success':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Notificações</CardTitle>
            <p className="text-sm text-slate-600">Alertas e lembretes importantes</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {notifications.map((notification, index) => (
            <div 
              key={notification.id}
              className={`p-4 hover:bg-slate-50/50 transition-all duration-300 animate-slideInUp`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between space-x-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {notification.title}
                      </h4>
                      <Badge className={`text-xs ${getBadgeColor(notification.type)}`}>
                        {notification.type === 'error' ? 'Urgente' :
                         notification.type === 'warning' ? 'Atenção' :
                         notification.type === 'success' ? 'OK' : 'Info'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {notification.timestamp.toLocaleTimeString('pt-BR')}
                      </p>
                      
                      {notification.action && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7 px-3"
                          onClick={() => window.location.href = notification.action!.href}
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}