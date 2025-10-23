import { Badge } from '@/components/ui/badge'
import { Crown, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManagerBadgeProps {
  isManager: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
  className?: string
}

export function ManagerBadge({ 
  isManager, 
  size = 'md', 
  variant = 'default',
  className 
}: ManagerBadgeProps) {
  if (!isManager) return null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  return (
    <Badge 
      variant={variant}
      className={cn(
        'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400 hover:from-amber-600 hover:to-orange-600',
        'font-semibold shadow-sm',
        sizeClasses[size],
        className
      )}
    >
      <Crown className={cn('mr-1', iconSizes[size])} />
      Gestor
    </Badge>
  )
}

export function ManagerIcon({ 
  isManager, 
  size = 'md',
  className 
}: { 
  isManager: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  if (!isManager) return null

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div title="Credor Gestor">
      <Crown 
        className={cn(
          'text-amber-500',
          iconSizes[size],
          className
        )}
      />
    </div>
  )
}

export function CapitalProprioLabel({ 
  isManager,
  size = 'md',
  className 
}: {
  isManager: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (!isManager) return null

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div className={cn(
      'flex items-center text-amber-600 font-medium',
      sizeClasses[size],
      className
    )}>
      <Building2 className={cn('mr-1', iconSizes[size])} />
      Capital Próprio
    </div>
  )
}