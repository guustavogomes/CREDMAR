import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ManagerBadge, ManagerIcon, CapitalProprioLabel } from '@/components/ui/manager-badge'

describe('ManagerBadge', () => {
  it('should render badge when isManager is true', () => {
    render(<ManagerBadge isManager={true} />)
    
    expect(screen.getByText('Gestor')).toBeInTheDocument()
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Crown icon
  })

  it('should not render when isManager is false', () => {
    render(<ManagerBadge isManager={false} />)
    
    expect(screen.queryByText('Gestor')).not.toBeInTheDocument()
  })

  it('should render with correct size classes', () => {
    const { rerender } = render(<ManagerBadge isManager={true} size="sm" />)
    let badge = screen.getByText('Gestor').closest('span')
    expect(badge).toHaveClass('text-xs')

    rerender(<ManagerBadge isManager={true} size="md" />)
    badge = screen.getByText('Gestor').closest('span')
    expect(badge).toHaveClass('text-sm')

    rerender(<ManagerBadge isManager={true} size="lg" />)
    badge = screen.getByText('Gestor').closest('span')
    expect(badge).toHaveClass('text-base')
  })

  it('should apply custom className', () => {
    render(<ManagerBadge isManager={true} className="custom-class" />)
    
    const badge = screen.getByText('Gestor').closest('span')
    expect(badge).toHaveClass('custom-class')
  })

  it('should render with outline variant', () => {
    render(<ManagerBadge isManager={true} variant="outline" />)
    
    const badge = screen.getByText('Gestor').closest('span')
    expect(badge).toBeInTheDocument()
  })
})

describe('ManagerIcon', () => {
  it('should render icon when isManager is true', () => {
    render(<ManagerIcon isManager={true} />)
    
    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('title', 'Credor Gestor')
  })

  it('should not render when isManager is false', () => {
    render(<ManagerIcon isManager={false} />)
    
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { rerender } = render(<ManagerIcon isManager={true} size="sm" />)
    let icon = screen.getByRole('img', { hidden: true })
    expect(icon).toHaveClass('h-4', 'w-4')

    rerender(<ManagerIcon isManager={true} size="md" />)
    icon = screen.getByRole('img', { hidden: true })
    expect(icon).toHaveClass('h-5', 'w-5')

    rerender(<ManagerIcon isManager={true} size="lg" />)
    icon = screen.getByRole('img', { hidden: true })
    expect(icon).toHaveClass('h-6', 'w-6')
  })

  it('should apply custom className', () => {
    render(<ManagerIcon isManager={true} className="custom-icon-class" />)
    
    const icon = screen.getByRole('img', { hidden: true })
    expect(icon).toHaveClass('custom-icon-class')
  })
})

describe('CapitalProprioLabel', () => {
  it('should render label when isManager is true', () => {
    render(<CapitalProprioLabel isManager={true} />)
    
    expect(screen.getByText('Capital Próprio')).toBeInTheDocument()
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Building2 icon
  })

  it('should not render when isManager is false', () => {
    render(<CapitalProprioLabel isManager={false} />)
    
    expect(screen.queryByText('Capital Próprio')).not.toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { rerender } = render(<CapitalProprioLabel isManager={true} size="sm" />)
    let label = screen.getByText('Capital Próprio').closest('div')
    expect(label).toHaveClass('text-xs')

    rerender(<CapitalProprioLabel isManager={true} size="md" />)
    label = screen.getByText('Capital Próprio').closest('div')
    expect(label).toHaveClass('text-sm')

    rerender(<CapitalProprioLabel isManager={true} size="lg" />)
    label = screen.getByText('Capital Próprio').closest('div')
    expect(label).toHaveClass('text-base')
  })

  it('should apply custom className', () => {
    render(<CapitalProprioLabel isManager={true} className="custom-label-class" />)
    
    const label = screen.getByText('Capital Próprio').closest('div')
    expect(label).toHaveClass('custom-label-class')
  })
})