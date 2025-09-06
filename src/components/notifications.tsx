"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: 'urgent' | 'warning' | 'error' | 'info' | 'success'
  icon: string
  title: string
  message: string
  action?: string
  priority: number
}

interface NotificationsData {
  notifications: Notification[]
  total: number
  unread: number
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<NotificationsData | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent':
      case 'error':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100'
      case 'warning':
        return 'border-l-orange-500 bg-orange-50 hover:bg-orange-100'
      case 'info':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100'
      case 'success':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100'
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action) {
      router.push(notification.action)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {data && data.unread > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500"
          >
            {data.unread > 9 ? '9+' : data.unread}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96">
            <Card className="shadow-xl border border-border bg-background">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Notificações</CardTitle>
                  <div className="flex items-center gap-2">
                    {data && (
                      <Badge variant="outline" className="text-xs">
                        {data.total} total
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : data && data.notifications.length > 0 ? (
                    <div className="space-y-1">
                      {data.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-l-4 cursor-pointer transition-colors ${getNotificationColor(notification.type)} ${
                            notification.action ? 'hover:scale-[1.01]' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0 mt-0.5">
                              {notification.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm text-foreground">
                                  {notification.title}
                                </h4>
                                {notification.priority <= 2 && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 leading-tight">
                                {notification.message}
                              </p>
                              {notification.action && (
                                <p className="text-xs text-primary mt-2 font-medium">
                                  Clique para ver detalhes →
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma notificação no momento
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tudo está em dia! 🎉
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="border-t border-border p-3 bg-muted/30">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Atualizado automaticamente</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchNotifications}
                      disabled={loading}
                      className="h-6 px-2 text-xs"
                    >
                      {loading ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}