"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

interface RealTimeStatsProps {
  stats: {
    totalReceivedThisMonth: number
    uniqueCustomers: number
    activeLoans: number
    defaultRate: number
  }
}

export function RealTimeStats({ stats }: RealTimeStatsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const statsData = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(stats.totalReceivedThisMonth),
      icon: DollarSign,
      trend: "up",
      change: "+12.5%",
      color: "emerald"
    },
    {
      title: "Clientes Ativos",
      value: stats.uniqueCustomers.toString(),
      icon: Users,
      trend: "up",
      change: "+3.2%",
      color: "blue"
    },
    {
      title: "Contratos Ativos",
      value: stats.activeLoans.toString(),
      icon: Activity,
      trend: "up",
      change: "+8.1%",
      color: "indigo"
    },
    {
      title: "Taxa Inadimplência",
      value: `${stats.defaultRate}%`,
      icon: TrendingDown,
      trend: "down",
      change: "-2.1%",
      color: "red"
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-1000 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        const isPositive = stat.trend === "up"
        
        return (
          <Card 
            key={stat.title}
            className={`relative overflow-hidden border-0 shadow-md bg-white hover:shadow-lg transition-all duration-300 animate-slideInUp`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${
                  stat.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                  stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stat.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                  'from-red-500 to-red-600'
                }`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    isPositive 
                      ? 'border-emerald-200 text-emerald-600 bg-emerald-50' 
                      : 'border-red-200 text-red-600 bg-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium">
                  {stat.title}
                </p>
                <p className={`text-lg font-bold ${
                  stat.color === 'emerald' ? 'text-emerald-600' :
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'indigo' ? 'text-indigo-600' :
                  'text-red-600'
                }`}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
            
            <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${
              stat.color === 'emerald' ? 'from-emerald-500 to-green-500' :
              stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
              stat.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
              'from-red-500 to-red-600'
            }`}></div>
          </Card>
        )
      })}
    </div>
  )
}